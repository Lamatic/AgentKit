from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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


class AnalyzeRequest(BaseModel):
    pdf_url: str


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
