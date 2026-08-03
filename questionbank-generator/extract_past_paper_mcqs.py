"""
Extract MCQs from scanned MDCAT past papers using the local LM Studio vision model.

Usage:
  python extract_past_paper_mcqs.py "<pdf_path>" --subject "<subject>" [--out <file>] [--start <page>] [--end <page>]

This mirrors the API call in generate_mcqs.py (same endpoint, model, temperature,
max_tokens, image encoding) but uses an EXTRACTION prompt instead of a generation
prompt so the model reads the scanned exam page and returns the MCQs as printed.
"""
import pypdfium2 as pdfium
import requests
import base64
import json
import io
import sys
import os
import argparse
import re
from pathlib import Path

API_URL = "http://localhost:1234/v1/chat/completions"
MODEL = "qwen2.5-vl-7b-instruct"

EXTRACT_PROMPT = """This image is a scanned page from a real MDCAT past paper.

Extract EVERY MCQ exactly as printed on this page. Do NOT generate new questions, do NOT rewrite the wording, do NOT skip any question.

For each MCQ output one JSON object:
{{"text": "the question stem exactly as printed", "options": {{"A": "...", "B": "...", "C": "...", "D": "..."}}, "correct": "A"}}

RULES:
1. Use the EXACT original question text and option wording from the page.
2. "correct": the letter of the answer if it is visible/marked on the page (circled, underlined, or shown in an answer key section). If you cannot determine the answer, use "?".
3. Include ALL questions visible on the page, in order.
4. Options may be A-D (or A-E if present - keep them).
5. Output ONLY a valid JSON array. No markdown, no code fences, no extra text."""


def render_page(pdf_path, page_index, scale=1.5):
    pdf = pdfium.PdfDocument(pdf_path)
    page = pdf[page_index]
    bitmap = page.render(scale=scale)
    img = bitmap.to_pil()
    page.close()
    pdf.close()
    return img


def image_to_b64(img):
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return base64.b64encode(buf.getvalue()).decode()


def parse_json_robust(text):
    """Same tolerant parser as the generator's json_utils.py (inline)."""
    if not text:
        raise ValueError("Empty response")
    text = text.strip()
    # strip code fences
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
    text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE).strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    start, end = text.find("["), text.rfind("]")
    if start != -1 and end > start:
        candidate = text[start:end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass
        # Repair rows like {"number": 84, "A"} -> {"number": 84, "answer": "A"}
        repaired = re.sub(r'"(\d+)"\s*,\s*"([ABCD"])', r'"number": \1, "answer": "\2', candidate)
        repaired = re.sub(r'"number"\s*:\s*(\d+)\s*,\s*"([ABCD])"', r'"number": \1, "answer": "\2"', repaired)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError:
            pass
    raise ValueError(f"Could not parse JSON. First 200: {text[:200]!r}")


def extract_page(image_b64):
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": EXTRACT_PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                ],
            }
        ],
        "temperature": 0.1,
        "max_tokens": 4096,
    }
    resp = requests.post(API_URL, json=payload, timeout=120)
    if resp.status_code != 200:
        raise Exception(f"API error {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    text = data["choices"][0]["message"]["content"] or ""
    return parse_json_robust(text)


ANSWER_KEY_PROMPT = """This image is the ANSWER KEY table from an MDCAT past paper.

The table has rows for question numbers and columns for paper codes (e.g. Paper A, Paper B, Paper C, Paper D or CODE-A, CODE-2, etc.). Each cell contains a single answer letter (A, B, C, or D).

Extract the answer key for the paper code that is most prominently marked or the first/primary column. If the image shows which code this specific paper used, use that column.

Output a JSON array of objects, one per row:
[{{"number": 1, "answer": "B"}}, {{"number": 2, "answer": "D"}}, ...]

RULES:
1. Include EVERY row's question number and its answer letter.
2. If a cell is blank or illegible, use "?".
3. Output ONLY a valid JSON array. No markdown, no extra text."""


def extract_answer_key(image_b64):
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": ANSWER_KEY_PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
                ],
            }
        ],
        "temperature": 0.0,
        "max_tokens": 4096,
    }
    resp = requests.post(API_URL, json=payload, timeout=120)
    if resp.status_code != 200:
        raise Exception(f"API error {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    text = data["choices"][0]["message"]["content"] or ""
    return parse_json_robust(text)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf")
    parser.add_argument("--subject", "-s", default="Biology")
    parser.add_argument("--out", "-o")
    parser.add_argument("--start", type=int)
    parser.add_argument("--end", type=int)
    parser.add_argument("--key", action="store_true", help="Extract answer key table instead of MCQs")
    args = parser.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"File not found: {pdf_path}")
        sys.exit(1)

    doc = pdfium.PdfDocument(str(pdf_path))
    total = len(doc)
    doc.close()

    start = (args.start or 1) - 1
    end = (args.end or total) - 1
    page_range = list(range(start, min(end + 1, total)))

    if args.key:
        print(f"Extracting ANSWER KEY: {pdf_path.name} | pages {start+1}-{min(end+1,total)}")
        key = {}
        for i, pnum in enumerate(page_range):
            try:
                print(f"  [{i+1}/{len(page_range)}] Page {pnum+1}... ", end="", flush=True)
                img = render_page(str(pdf_path), pnum, scale=2.0)
                b64 = image_to_b64(img)
                rows = extract_answer_key(b64)
                added = 0
                for r in rows:
                    if not isinstance(r, dict) or not isinstance(r.get("number"), int):
                        continue
                    ans = str(r.get("answer", "") or "").strip().upper()
                    key[r["number"]] = ans if ans in "ABCD" else "?"
                    added += 1
                print(f"{added} key rows")
            except Exception as e:
                print(f"FAILED page {pnum+1}: {e}")
        print(f"\nTotal key rows: {len(key)}")
        out_path = args.out or (pdf_path.stem.replace(" ", "_") + "_answer_key.json")
        out_path = Path(out_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(key, f, indent=2, ensure_ascii=False)
        print(f"Saved: {out_path}")
        return

    print(f"Processing: {pdf_path.name} | pages {start+1}-{min(end+1,total)} of {total} | subject={args.subject}")

    all_mcqs = []
    for i, pnum in enumerate(page_range):
        try:
            print(f"  [{i+1}/{len(page_range)}] Page {pnum+1}... ", end="", flush=True)
            img = render_page(str(pdf_path), pnum)
            b64 = image_to_b64(img)
            mcqs = extract_page(b64)
            # Normalize
            valid = []
            for m in mcqs:
                if not isinstance(m, dict) or not m.get("text"):
                    continue
                opts = m.get("options") or {}
                opts = {str(k).upper(): str(v) for k, v in opts.items()}
                correct = str(m.get("correct", "") or "").strip().upper()
                valid.append({
                    "text": m["text"].strip(),
                    "options": opts,
                    "correct": correct if correct in opts else "?",
                    "subject": args.subject,
                })
            all_mcqs.extend(valid)
            print(f"{len(valid)} MCQs")
        except Exception as e:
            print(f"FAILED page {pnum+1}: {e}")

    print(f"\nTotal extracted: {len(all_mcqs)}")

    out_path = args.out
    if not out_path:
        out_path = pdf_path.stem.replace(" ", "_") + "_extracted.json"
    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(all_mcqs, f, indent=2, ensure_ascii=False)
    print(f"Saved: {out_path}")


if __name__ == "__main__":
    main()
