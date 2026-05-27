from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl
import httpx
import os
from dotenv import load_dotenv

load_dotenv()

LAMATIC_API_URL = os.getenv("LAMATIC_API_URL", "").rstrip("/")
LAMATIC_PROJECT_ID = os.getenv("LAMATIC_PROJECT_ID", "")
LAMATIC_API_KEY = os.getenv("LAMATIC_API_KEY", "")
FLOW_ID = os.getenv("RESEARCH_PAPER_ANALYZER_FLOW_ID", "")

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
        raise HTTPException(status_code=500, detail="RESEARCH_PAPER_ANALYZER_FLOW_ID is not set.")
    if not LAMATIC_API_URL or not LAMATIC_API_KEY or not LAMATIC_PROJECT_ID:
        raise HTTPException(status_code=500, detail="Lamatic API credentials are not set.")

    payload = {"pdf_url": req.pdf_url}
    headers = {
        "Authorization": f"Bearer {LAMATIC_API_KEY}",
        "x-project-id": LAMATIC_PROJECT_ID,
        "Content-Type": "application/json",
    }

    # Lamatic flow execution endpoint
    url = f"{LAMATIC_API_URL}/v1/flows/{FLOW_ID}/execute"

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, headers=headers, json=payload)

        if response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid Lamatic API key or project ID.")
        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="Flow not found. Check your RESEARCH_PAPER_ANALYZER_FLOW_ID.")
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Lamatic API error: {response.text}",
            )

        data = response.json()
        # Lamatic returns result under result.output or result.answer
        analysis = (
            data.get("result", {}).get("output")
            or data.get("result", {}).get("answer")
        )

        if not analysis:
            raise HTTPException(status_code=500, detail="No analysis returned by the flow.")

        return {"success": True, "data": analysis}

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request timed out. The PDF may be too large.")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Network error: {str(e)}")
