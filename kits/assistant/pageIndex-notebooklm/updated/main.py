"""
PageIndex FastAPI — Full Implementation
Mirrors the VectifyAI/PageIndex architecture with Groq multi-key pool.
"""

import os
import asyncio
import base64
import json
import re
import tempfile
import uuid
import itertools
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ─────────────────────────────────────────────────────────────────────────────
# App setup
# ─────────────────────────────────────────────────────────────────────────────

app = FastAPI(title="PageIndex — Groq Multi-Key")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def verify_key(x_api_key: str):
    expected = os.getenv("SERVER_API_KEY", "")
    if expected and x_api_key != expected:
        raise HTTPException(status_code=401, detail="Invalid API key")


# ─────────────────────────────────────────────────────────────────────────────
# Groq Multi-Key Pool
# ─────────────────────────────────────────────────────────────────────────────

def _load_groq_keys() -> list[str]:
    """Auto-detect all available GROQ_API_KEY_N vars (N=1..20) plus legacy GROQ_API_KEY."""
    keys = []
    for i in range(1, 21):
        k = os.getenv(f"GROQ_API_KEY_{i}")
        if k and k.strip():
            keys.append(k.strip())
    legacy = os.getenv("GROQ_API_KEY", "")
    if legacy.strip() and legacy.strip() not in keys:
        keys.append(legacy.strip())
    return keys


GROQ_KEYS: list[str] = []
_key_cycle = None
_key_lock = asyncio.Lock()


@app.on_event("startup")
async def startup():
    global GROQ_KEYS, _key_cycle
    GROQ_KEYS = _load_groq_keys()
    if not GROQ_KEYS:
        raise RuntimeError("No Groq API keys found. Set GROQ_API_KEY_1 ... GROQ_API_KEY_N")
    _key_cycle = itertools.cycle(range(len(GROQ_KEYS)))
    print(f"[PageIndex] Loaded {len(GROQ_KEYS)} Groq API key(s)")


async def _next_key() -> tuple[int, str]:
    async with _key_lock:
        idx = next(_key_cycle)
    return idx, GROQ_KEYS[idx]


async def llm_call(
    prompt: str,
    max_tokens: int = 1024,
    json_mode: bool = True,
    system: str = "You are an expert document analyst. Return valid JSON only, no markdown, no extra text.",
) -> str:
    max_tokens = min(max_tokens, 4096)
    tried_keys: set[int] = set()

    for attempt in range(len(GROQ_KEYS) + 1):
        idx, key = await _next_key()
        if idx in tried_keys and len(tried_keys) >= len(GROQ_KEYS):
            raise HTTPException(status_code=429, detail="All Groq keys rate-limited")
        tried_keys.add(idx)

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.1,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json=payload,
            )

        if resp.status_code == 429:
            await asyncio.sleep(1)
            continue

        data = resp.json()
        if "error" in data:
            err = data["error"].get("message", str(data["error"]))
            if "rate_limit" in err.lower() or "token" in err.lower():
                await asyncio.sleep(1)
                continue
            raise HTTPException(status_code=500, detail=f"Groq error: {err}")

        return data["choices"][0]["message"]["content"].strip()

    raise HTTPException(status_code=429, detail="All Groq keys exhausted")


async def llm_call_many(prompts: list[str], max_tokens: int = 512, json_mode: bool = True) -> list[str]:
    tasks = [llm_call(p, max_tokens=max_tokens, json_mode=json_mode) for p in prompts]
    return await asyncio.gather(*tasks)


def extract_json(text: str) -> dict | list:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        for pattern in [r"\{.*\}", r"\[.*\]"]:
            m = re.search(pattern, text, re.DOTALL)
            if m:
                try:
                    return json.loads(m.group())
                except Exception:
                    pass
        return {}


# ─────────────────────────────────────────────────────────────────────────────
# PDF Extraction
# ─────────────────────────────────────────────────────────────────────────────

def extract_pdf_pages(pdf_path: str) -> tuple[list[tuple[str, int]], int]:
    import pypdf
    reader = pypdf.PdfReader(pdf_path)
    total = len(reader.pages)
    pages = []
    for i, page in enumerate(reader.pages):
        t = page.extract_text() or ""
        pages.append((t.strip(), i + 1))
    return pages, total


def get_raw_text(page_list: list[tuple[str, int]]) -> str:
    parts = []
    for text, phys in page_list:
        if text:
            parts.append(f"[PAGE {phys}]\n{text}")
    return "\n\n".join(parts)


def get_page_content_by_range(page_list: list, start: int, end: int) -> str:
    parts = []
    for text, phys in page_list:
        if start <= phys <= end:
            parts.append(f"<physical_index_{phys}>\n{text}\n<physical_index_{phys}>\n")
    return "\n".join(parts)


# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: TOC Detection
# ─────────────────────────────────────────────────────────────────────────────

async def detect_toc_pages(page_list: list[tuple[str, int]], check_up_to: int = 20) -> list[int]:
    candidates = page_list[:check_up_to]
    prompts = []
    for text, phys in candidates:
        prompts.append(f"""Does the following page contain a Table of Contents (list of chapters/sections with page numbers)?
Note: abstract, summary, notation lists, figure lists are NOT table of contents.

Page text:
{text[:2000]}

Return JSON: {{"thinking": "<reason>", "toc_detected": "yes or no"}}""")

    results = await llm_call_many(prompts, max_tokens=150, json_mode=True)

    toc_pages = []
    for raw, (text, phys) in zip(results, candidates):
        parsed = extract_json(raw)
        if isinstance(parsed, dict) and parsed.get("toc_detected") == "yes":
            toc_pages.append(phys)
    return toc_pages


# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: TOC Extraction
# ─────────────────────────────────────────────────────────────────────────────

EXTRACT_TOC_PROMPT = """Extract the FULL table of contents from the given text.
Replace any ......... or dotted leaders with :.
Return ONLY the table of contents text, nothing else."""

VERIFY_TOC_COMPLETE_PROMPT = """You are given a raw table of contents and a cleaned/extracted version.
Check if the cleaned version is complete (contains all main sections from the raw).

Raw TOC:
{raw}

Cleaned TOC:
{cleaned}

Return JSON: {{"thinking": "<reason>", "completed": "yes or no"}}"""

CONTINUE_TOC_PROMPT = """Continue the table of contents extraction. Output ONLY the remaining part (not what was already extracted).

Original raw TOC:
{raw}

Already extracted:
{partial}

Continue from where it left off:"""


async def extract_toc_with_retry(toc_raw: str, max_attempts: int = 5) -> str:
    prompt = f"{EXTRACT_TOC_PROMPT}\n\nGiven text:\n{toc_raw[:4000]}"
    extracted, _ = await _llm_with_finish_reason(prompt, max_tokens=2000)

    for attempt in range(max_attempts):
        verify_prompt = VERIFY_TOC_COMPLETE_PROMPT.format(raw=toc_raw[:3000], cleaned=extracted)
        verify_raw = await llm_call(verify_prompt, max_tokens=200, json_mode=True)
        verify = extract_json(verify_raw)
        completed = verify.get("completed", "no") if isinstance(verify, dict) else "no"
        if completed == "yes":
            break
        cont_prompt = CONTINUE_TOC_PROMPT.format(raw=toc_raw[:3000], partial=extracted)
        continuation, _ = await _llm_with_finish_reason(cont_prompt, max_tokens=1500, json_mode=False)
        extracted = extracted + "\n" + continuation

    return extracted


async def _llm_with_finish_reason(prompt: str, max_tokens: int = 1024, json_mode: bool = True) -> tuple[str, str]:
    max_tokens = min(max_tokens, 4096)
    tried: set[int] = set()

    for _ in range(len(GROQ_KEYS) + 1):
        idx, key = await _next_key()
        if idx in tried and len(tried) >= len(GROQ_KEYS):
            raise HTTPException(status_code=429, detail="All Groq keys rate-limited")
        tried.add(idx)

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {"role": "system", "content": "You are an expert document analyst."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.1,
            "max_tokens": max_tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
                json=payload,
            )

        if resp.status_code == 429:
            await asyncio.sleep(1)
            continue

        data = resp.json()
        if "error" in data:
            continue

        choice = data["choices"][0]
        content = choice["message"]["content"].strip()
        finish = choice.get("finish_reason", "stop")
        finish_mapped = "finished" if finish in ("stop", "eos") else finish
        return content, finish_mapped

    raise HTTPException(status_code=429, detail="All Groq keys exhausted")


# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: TOC → Structured JSON
# ─────────────────────────────────────────────────────────────────────────────

TOC_TRANSFORM_PROMPT = """Transform the following table of contents into a JSON array.

'structure' is the numeric hierarchy: "1", "1.1", "1.2.3" etc.
If a section has no numeric prefix, use sequential numbers.

Return JSON:
{{
  "table_of_contents": [
    {{"structure": "1", "title": "Introduction", "page": 1}},
    {{"structure": "1.1", "title": "Background", "page": 2}},
    ...
  ]
}}

Table of contents:
{toc_text}"""


async def toc_to_json(toc_text: str) -> list[dict]:
    prompt = TOC_TRANSFORM_PROMPT.format(toc_text=toc_text[:3000])
    raw, finish = await _llm_with_finish_reason(prompt, max_tokens=3000, json_mode=True)

    parsed = extract_json(raw)
    items = []
    if isinstance(parsed, dict) and "table_of_contents" in parsed:
        items = parsed["table_of_contents"]
    elif isinstance(parsed, list):
        items = parsed

    verify_prompt = f"""Is the following cleaned table of contents complete relative to the raw?
Raw:
{toc_text[:2000]}

Cleaned (JSON):
{json.dumps(items[:30], indent=2)}

Return JSON: {{"thinking": "<reason>", "completed": "yes or no"}}"""

    verify_raw = await llm_call(verify_prompt, max_tokens=200)
    verify = extract_json(verify_raw)

    if isinstance(verify, dict) and verify.get("completed") == "no" and len(items) > 0:
        last = items[-1]
        cont_prompt = f"""Continue the JSON table of contents array from after this entry:
{json.dumps(last)}

Raw TOC for reference:
{toc_text[:3000]}

Output ONLY the additional JSON array items (not the already-extracted ones), as a JSON array."""
        cont_raw, _ = await _llm_with_finish_reason(cont_prompt, max_tokens=2000, json_mode=False)
        try:
            m = re.search(r"\[.*\]", cont_raw, re.DOTALL)
            if m:
                extra = json.loads(m.group())
                if isinstance(extra, list):
                    items.extend(extra)
        except Exception:
            pass

    for item in items:
        try:
            item["page"] = int(item.get("page") or 0) or None
        except (ValueError, TypeError):
            item["page"] = None

    return items


# ─────────────────────────────────────────────────────────────────────────────
# Stage 4: Assign Physical Indices
# ─────────────────────────────────────────────────────────────────────────────

ASSIGN_INDEX_PROMPT = """You are given a table of contents entry and several document pages.
Find which physical page this section starts on.

Section title: {title}
TOC page number: {page}

Document pages (search these):
{pages}

Return JSON:
{{"thinking": "<which page contains the start of this section>",
  "physical_index": <number or null>}}"""


async def assign_physical_indices(
    toc_items: list[dict], page_list: list[tuple[str, int]], total_pages: int
) -> list[dict]:
    async def _assign(item: dict) -> dict:
        toc_page = item.get("page")
        if toc_page is None:
            item["physical_index"] = None
            return item

        search_start = max(1, toc_page - 1)
        search_end = min(total_pages, toc_page + 3)
        pages_text = get_page_content_by_range(page_list, search_start, search_end)

        if not pages_text.strip():
            item["physical_index"] = toc_page
            return item

        prompt = ASSIGN_INDEX_PROMPT.format(
            title=item.get("title", ""),
            page=toc_page,
            pages=pages_text[:2500],
        )
        raw = await llm_call(prompt, max_tokens=200)
        parsed = extract_json(raw)
        if isinstance(parsed, dict):
            pi = parsed.get("physical_index")
            try:
                item["physical_index"] = int(pi) if pi is not None else toc_page
            except (ValueError, TypeError):
                item["physical_index"] = toc_page
        else:
            item["physical_index"] = toc_page
        return item

    results = await asyncio.gather(*[_assign(item) for item in toc_items])
    return list(results)


# ─────────────────────────────────────────────────────────────────────────────
# Stage 5: Build Nested Tree with start_index / end_index
# ─────────────────────────────────────────────────────────────────────────────

def build_tree_from_flat(items: list[dict], total_pages: int) -> list[dict]:
    def parse_depth(structure: str) -> int:
        if not structure:
            return 1
        return len(structure.split("."))

    try:
        items = sorted(items, key=lambda x: [int(p) for p in (x.get("structure") or "0").split(".")])
    except Exception:
        pass

    for i, item in enumerate(items):
        start = item.get("physical_index") or item.get("page") or 1
        if i + 1 < len(items):
            next_start = items[i + 1].get("physical_index") or items[i + 1].get("page") or (start + 1)
            end = max(start, next_start - 1)
        else:
            end = total_pages
        item["_start"] = start
        item["_end"] = end

    root: list[dict] = []
    stack: list[tuple[int, list[dict]]] = [(0, root)]
    node_counters: dict[str, int] = {}

    for item in items:
        depth = parse_depth(item.get("structure", ""))
        title = item.get("title", "Untitled")
        start = item["_start"]
        end = item["_end"]

        parent_id = stack[-1][1][-1]["node_id"] if stack[-1][1] else ""
        counter_key = f"depth_{depth}"
        node_counters[counter_key] = node_counters.get(counter_key, 0) + 1
        node_id = f"{node_counters[counter_key]:04d}" if depth == 1 else f"{parent_id}_{node_counters[counter_key]:02d}"

        node = {
            "node_id": node_id,
            "title": title,
            "start_index": start,
            "end_index": end,
            "summary": "",
            "nodes": [],
        }

        while len(stack) > 1 and stack[-1][0] >= depth:
            stack.pop()

        stack[-1][1].append(node)
        stack.append((depth, node["nodes"]))

    return root


# ─────────────────────────────────────────────────────────────────────────────
# Stage 6: Per-Node Summary Generation
# ─────────────────────────────────────────────────────────────────────────────

SUMMARY_PROMPT = """Read the following document section and write a 1-2 sentence summary of what it covers.
Be concise (under 200 chars). Do NOT include quotes or raw data from the text.
Example: "Covers thermal decomposition of H2O2 catalysts and reaction kinetics."

Section title: {title}
Section text (first 1500 chars):
{text}

Return JSON: {{"summary": "<your summary>"}}"""


async def add_node_summaries(tree: list[dict], page_list: list[tuple[str, int]]) -> list[dict]:
    def collect_nodes(nodes: list[dict]) -> list[dict]:
        flat = []
        for n in nodes:
            flat.append(n)
            if n.get("nodes"):
                flat.extend(collect_nodes(n["nodes"]))
        return flat

    all_nodes = collect_nodes(tree)

    async def _summarise(node: dict) -> None:
        text = get_page_content_by_range(page_list, node["start_index"], min(node["start_index"] + 1, node["end_index"]))
        if not text.strip():
            node["summary"] = f"Section: {node['title']}"
            return
        prompt = SUMMARY_PROMPT.format(title=node["title"], text=text[:1500])
        raw = await llm_call(prompt, max_tokens=150)
        parsed = extract_json(raw)
        node["summary"] = parsed.get("summary", node["title"]) if isinstance(parsed, dict) else node["title"]

    await asyncio.gather(*[_summarise(n) for n in all_nodes])
    return tree


# ─────────────────────────────────────────────────────────────────────────────
# Stage 7: Per-Node Page Verification
# ─────────────────────────────────────────────────────────────────────────────

VERIFY_PAGE_PROMPT = """Check if the section titled "{title}" appears or starts on the given page.
Do fuzzy matching — ignore minor spacing differences.

Page text:
{page_text}

Return JSON: {{"thinking": "<reason>", "answer": "yes or no"}}"""


async def verify_node_pages(tree: list[dict], page_list: list[tuple[str, int]], total_pages: int) -> list[dict]:
    def collect_nodes(nodes: list[dict]) -> list[dict]:
        flat = []
        for n in nodes:
            flat.append(n)
            if n.get("nodes"):
                flat.extend(collect_nodes(n["nodes"]))
        return flat

    page_map = {phys: text for text, phys in page_list}

    async def _verify(node: dict) -> None:
        si = node.get("start_index", 1)
        page_text = page_map.get(si, "")
        if not page_text.strip():
            return

        prompt = VERIFY_PAGE_PROMPT.format(title=node["title"], page_text=page_text[:1500])
        raw = await llm_call(prompt, max_tokens=150)
        parsed = extract_json(raw)
        answer = parsed.get("answer", "yes") if isinstance(parsed, dict) else "yes"

        if answer != "yes":
            for delta in [-1, 1, -2, 2]:
                candidate = si + delta
                if candidate < 1 or candidate > total_pages:
                    continue
                alt_text = page_map.get(candidate, "")
                if not alt_text:
                    continue
                prompt2 = VERIFY_PAGE_PROMPT.format(title=node["title"], page_text=alt_text[:1500])
                raw2 = await llm_call(prompt2, max_tokens=150)
                p2 = extract_json(raw2)
                if isinstance(p2, dict) and p2.get("answer") == "yes":
                    node["start_index"] = candidate
                    break

    all_nodes = collect_nodes(tree)
    await asyncio.gather(*[_verify(n) for n in all_nodes])
    return tree


# ─────────────────────────────────────────────────────────────────────────────
# Fallback: No-TOC page-by-page structure extraction
# ─────────────────────────────────────────────────────────────────────────────

NO_TOC_INIT_PROMPT = """You are an expert in extracting hierarchical structure from documents.
Read the following pages and extract the sections/headings you find.

The tags <physical_index_X> mark page boundaries.

Return a JSON array:
[
  {{"structure": "1", "title": "Section Title", "physical_index": <page number>}},
  ...
]
Only return sections found in the provided pages.

Document pages:
{pages}"""

NO_TOC_CONTINUE_PROMPT = """You are continuing to extract sections from a document.
Here is the structure found so far, and the next set of pages to process.
Continue the structure — add sections found in the new pages.

Previous structure:
{previous}

New pages:
{pages}

Return ONLY the NEW sections as a JSON array (not the already-found ones):
[
  {{"structure": "<x.x.x>", "title": "...", "physical_index": <page number>}},
  ...
]"""


async def extract_structure_no_toc(page_list: list[tuple[str, int]], chunk_size: int = 8) -> list[dict]:
    all_items: list[dict] = []
    total = len(page_list)

    for chunk_start in range(0, total, chunk_size):
        chunk = page_list[chunk_start: chunk_start + chunk_size]
        pages_text = "\n\n".join(
            f"<physical_index_{phys}>\n{text}\n<physical_index_{phys}>" for text, phys in chunk if text.strip()
        )

        if not pages_text.strip():
            continue

        if not all_items:
            prompt = NO_TOC_INIT_PROMPT.format(pages=pages_text[:3500])
        else:
            prompt = NO_TOC_CONTINUE_PROMPT.format(
                previous=json.dumps(all_items[-10:], indent=2),
                pages=pages_text[:3000],
            )

        raw, _ = await _llm_with_finish_reason(prompt, max_tokens=2000, json_mode=False)

        parsed = extract_json(raw)
        if isinstance(parsed, list):
            all_items.extend(parsed)
        elif isinstance(parsed, dict):
            for v in parsed.values():
                if isinstance(v, list):
                    all_items.extend(v)
                    break

    for item in all_items:
        pi = item.get("physical_index")
        try:
            item["physical_index"] = int(str(pi).split("_")[-1].rstrip(">").strip()) if pi else None
        except Exception:
            item["physical_index"] = None
        item.setdefault("page", item.get("physical_index"))

    return all_items


# ─────────────────────────────────────────────────────────────────────────────
# Tree utilities
# ─────────────────────────────────────────────────────────────────────────────

def count_nodes(nodes: list) -> int:
    c = 0
    for n in nodes:
        c += 1
        if n.get("nodes"):
            c += count_nodes(n["nodes"])
    return c


# ─────────────────────────────────────────────────────────────────────────────
# Request / Response models
# ─────────────────────────────────────────────────────────────────────────────

class UploadRequest(BaseModel):
    file_url: str
    file_name: Optional[str] = "document.pdf"


# ─────────────────────────────────────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "llama-3.3-70b-versatile via Groq",
        "groq_keys_loaded": len(GROQ_KEYS),
        "approach": "PageIndex — 7-stage pipeline (TOC detect→extract→JSON→assign→tree→summaries→verify)",
    }


@app.post("/doc/")
async def build_document_tree(
    req: UploadRequest,
    x_api_key: str = Header(...),
):
    verify_key(x_api_key)

    if not GROQ_KEYS:
        raise HTTPException(status_code=500, detail="No Groq API keys configured")

    # ── Download PDF ────────────────────────────────────────────────────────
    if req.file_url.startswith("data:"):
        try:
            _, encoded = req.file_url.split(",", 1)
            pdf_bytes = base64.b64decode(encoded)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid data URI: {e}")
    else:
        async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
            r = await client.get(req.file_url)
            if r.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Cannot download: HTTP {r.status_code}")
            if "text/html" in r.headers.get("content-type", ""):
                raise HTTPException(
                    status_code=400,
                    detail="URL returned HTML. For Google Drive use: https://drive.google.com/uc?export=download&id=FILE_ID",
                )
            pdf_bytes = r.content

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name

        # ── Extract pages ────────────────────────────────────────────────────
        page_list, total_pages = extract_pdf_pages(tmp_path)
        raw_text = get_raw_text(page_list)

        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="No text extracted — may be scanned/image-only PDF")

        # ── Stage 1: Detect TOC ──────────────────────────────────────────────
        toc_pages = await detect_toc_pages(page_list, check_up_to=min(20, total_pages))
        has_toc = len(toc_pages) > 0
        print(f"[PageIndex] TOC detected on pages: {toc_pages}")

        if has_toc:
            # ── Stage 2: Extract TOC text ────────────────────────────────────
            toc_raw_text = "\n\n".join(
                page_list[phys - 1][0] for phys in toc_pages if 0 < phys <= total_pages
            )
            toc_cleaned = await extract_toc_with_retry(toc_raw_text)

            # ── Stage 3: TOC → structured JSON ──────────────────────────────
            toc_items = await toc_to_json(toc_cleaned)
            print(f"[PageIndex] TOC items extracted: {len(toc_items)}")

            # ── Stage 4: Assign physical indices ────────────────────────────
            toc_items = await assign_physical_indices(toc_items, page_list, total_pages)

        else:
            print("[PageIndex] No TOC found — falling back to page-by-page extraction")
            toc_items = await extract_structure_no_toc(page_list)
            print(f"[PageIndex] Fallback items extracted: {len(toc_items)}")

        if not toc_items:
            raise HTTPException(status_code=500, detail="Failed to extract any structure from the document")

        # ── Stage 5: Build tree ──────────────────────────────────────────────
        tree = build_tree_from_flat(toc_items, total_pages)

        # ── Stage 6: Summaries ───────────────────────────────────────────────
        tree = await add_node_summaries(tree, page_list)

        # ── Stage 7: Verify pages ────────────────────────────────────────────
        tree = await verify_node_pages(tree, page_list, total_pages)

        doc_id = f"pi-{uuid.uuid4().hex[:16]}"

        return {
            "doc_id": doc_id,
            "file_name": req.file_name,
            "tree": tree,
            "raw_text": raw_text,
            "tree_node_count": count_nodes(tree),
            "top_level_nodes": len(tree),
            "total_pages": total_pages,
            "toc_found": has_toc,
            "toc_pages": toc_pages,
            "status": "completed",
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
