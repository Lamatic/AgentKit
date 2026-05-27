from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from urllib.parse import urlparse
import ipaddress
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

LAMATIC_API_URL = os.getenv("LAMATIC_API_URL", "").rstrip("/")
LAMATIC_PROJECT_ID = os.getenv("LAMATIC_PROJECT_ID", "")
LAMATIC_API_KEY = os.getenv("LAMATIC_API_KEY", "")
FLOW_ID = os.getenv("RESEARCH_PAPER_ANALYZER_FLOW_ID", "")

# Lamatic uses GraphQL — single POST endpoint per project
EXECUTE_QUERY = """
query ExecuteWorkflow($workflowId: String!, $payload: JSON) {
  executeWorkflow(workflowId: $workflowId, payload: $payload) {
    status
    result
  }
}
"""

app = FastAPI(title="Research Paper Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


_BLOCKED_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # link-local / cloud IMDS
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
]


class AnalyzeRequest(BaseModel):
    pdf_url: str

    @field_validator("pdf_url")
    @classmethod
    def validate_pdf_url(cls, v: str) -> str:
        parsed = urlparse(v)
        if parsed.scheme not in {"https"}:
            raise ValueError("Only HTTPS URLs are accepted.")
        hostname = parsed.hostname or ""
        if not hostname:
            raise ValueError("URL must contain a valid hostname.")
        try:
            ip = ipaddress.ip_address(hostname)
            if any(ip in net for net in _BLOCKED_RANGES):
                raise ValueError("URL resolves to a private or reserved address.")
        except ValueError as exc:
            if "private or reserved" in str(exc):
                raise
            # hostname is a domain name — pass through
        return v


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze_paper(req: AnalyzeRequest):
    if not FLOW_ID:
        raise HTTPException(500, "RESEARCH_PAPER_ANALYZER_FLOW_ID is not set.")
    if not LAMATIC_API_URL or not LAMATIC_API_KEY or not LAMATIC_PROJECT_ID:
        raise HTTPException(500, "Lamatic API credentials are not set.")

    headers = {
        "Authorization": f"Bearer {LAMATIC_API_KEY}",
        "x-project-id": LAMATIC_PROJECT_ID,
        "Content-Type": "application/json",
    }

    body = {
        "query": EXECUTE_QUERY,
        "variables": {
            "workflowId": FLOW_ID,
            "payload": {"pdf_url": req.pdf_url},
        },
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(LAMATIC_API_URL, headers=headers, json=body)

        if response.status_code == 401:
            raise HTTPException(401, "Invalid Lamatic API key or project ID.")
        if response.status_code != 200:
            raise HTTPException(response.status_code, f"Lamatic API error: {response.text}")

        data = response.json()

        # GraphQL errors surface inside data.errors
        if "errors" in data:
            raise HTTPException(500, f"Flow error: {data['errors'][0].get('message', 'unknown')}")

        execute_result = data.get("data", {}).get("executeWorkflow", {})

        if execute_result.get("status") != "success":
            raise HTTPException(500, f"Flow did not succeed: {execute_result.get('status')}")

        analysis = execute_result.get("result")

        if not analysis:
            raise HTTPException(500, "No analysis returned by the flow.")

        return {"success": True, "data": analysis}

    except httpx.TimeoutException:
        raise HTTPException(504, "Request timed out. The PDF may be too large.")
    except httpx.RequestError as e:
        raise HTTPException(503, f"Network error: {str(e)}")
