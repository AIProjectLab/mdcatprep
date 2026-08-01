import pypdfium2 as pdfium
import requests
import base64
import json
import io
import os
import sys
import time
from pathlib import Path

# Local LM Studio
API_URL = "http://localhost:1234/v1/chat/completions"
MODEL = "qwen2.5-vl-7b-instruct"
OUTPUT_DIR = Path(__file__).parent / "generated_mcqs"
OUTPUT_DIR.mkdir(exist_ok=True)

# Official PMDC MDCAT 2025 Biology Syllabus (16 units)
OFFICIAL_UNITS = {
    1: "Acellular Life (Viruses, AIDS)",
    2: "Bioenergetics (Respiration)",
    3: "Biological Molecules (Water, Carbs, Proteins, Lipids, DNA/RNA)",
    4: "Cell Structure & Function",
    5: "Coordination & Control / Nervous & Chemical Coordination",
    6: "Enzymes",
    7: "Evolution",
    8: "Reproduction",
    9: "Support & Movement",
    10: "Inheritance",
    11: "Circulation",
    12: "Immunity",
    13: "Respiration",
    14: "Digestion",
    15: "Homeostasis (Kidney, Thermoregulation)",
    16: "Biotechnology"
}

FEW_SHOT_EXAMPLES = [
    {"text": "Sugarcane contains ________", "options": {"A": "Fructose", "B": "Glucose", "C": "Ribose", "D": "Sucrose"}, "correct": "D", "subject": "Biology"},
    {"text": "Sickle cell anaemia results from?", "options": {"A": "Reduction in oxygen carrying capacity of haemoglobin", "B": "Linkage between the polypeptide chains", "C": "Single amino acid substitution in the haemoglobin molecule", "D": "Viral infections of RNA viruses"}, "correct": "C", "subject": "Biology"},
    {"text": "Which is INCORRECT about the globular proteins?", "options": {"A": "Abundantly found in hair", "B": "Are spherical in shape", "C": "Have polypeptide chains", "D": "Soluble in water"}, "correct": "A", "subject": "Biology"},
    {"text": "Lipids, which do not contain fatty acid are:", "options": {"A": "Neutral lipids", "B": "Phosphatidic acids", "C": "Steroids", "D": "Waxes"}, "correct": "C", "subject": "Biology"},
    {"text": "Catalase can be activated at pH:", "options": {"A": "1", "B": "3", "C": "5", "D": "7"}, "correct": "D", "subject": "Biology"},
    {"text": "The ________ in semen facilitate the transport of sperms.", "options": {"A": "Androgen", "B": "Prostaglandins", "C": "Oxytocin", "D": "Testosterone"}, "correct": "B", "subject": "Biology"},
    {"text": "Which of the following does NOT relate to smooth muscles?", "options": {"A": "Controlled by the autonomic nervous system", "B": "Have spindle shaped cells", "C": "Line the wall of heart", "D": "Lack striations"}, "correct": "C", "subject": "Biology"},
    {"text": "A motor neuron:", "options": {"A": "Carries impulse from effectors to CNS", "B": "Carries impulse from receptors to CNS", "C": "Carries impulse from CNS to muscles", "D": "Connects sensory nerves to ganglions."}, "correct": "C", "subject": "Biology"},
    {"text": "What happens to calcium when skeletal muscles recover from contraction?", "options": {"A": "Released from the sarcoplasmic reticulum", "B": "Released from the myosin head", "C": "Pumped into the sarcoplasmic reticulum", "D": "Exchanged for sodium ions"}, "correct": "C", "subject": "Biology"},
    {"text": "Plasma membrane is differentially permeable membrane due to the presence of?", "options": {"A": "Carbohydrates", "B": "Lipids", "C": "Proteins", "D": "Vitamins"}, "correct": "B", "subject": "Biology"},
    {"text": "Where are spindle fibres attached on a chromosome during cell division", "options": {"A": "Centromere", "B": "Histone proteins", "C": "Nucleolus", "D": "Telomere"}, "correct": "A", "subject": "Biology"},
    {"text": "Chromosome is typically made up from a combination of?", "options": {"A": "DNA and protein", "B": "DNA and RNA", "C": "RNA and lipids", "D": "RNA and proteins"}, "correct": "A", "subject": "Biology"},
    {"text": "Which cytoplasmic organelle make their own proteins?", "options": {"A": "Chromosomes", "B": "Golgi apparatus", "C": "Mitochondria", "D": "Smooth endoplasmic reticulum"}, "correct": "C", "subject": "Biology"}
]

OFFICIAL_UNITS_STR = "\n".join(f"  Unit {k}: {v}" for k, v in OFFICIAL_UNITS.items())
FEW_SHOT_JSON = json.dumps(FEW_SHOT_EXAMPLES, indent=2)


def render_page(pdf_path, page_index, scale=1):
    pdf = pdfium.PdfDocument(pdf_path)
    page = pdf[page_index]
    bitmap = page.render(scale=scale)
    img = bitmap.to_pil()
    page.close()
    pdf.close()
    return img


def image_to_b64(img):
    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=70)
    return base64.b64encode(buf.getvalue()).decode()


def _progress_path(output_path):
    return output_path.with_suffix(".progress.json")


def _load_progress(output_path):
    path = _progress_path(output_path)
    if not path.exists():
        return {}
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}


def _save_progress(output_path, progress):
    _save_json_atomic(_progress_path(output_path), progress)


def _save_json_atomic(path, data):
    """Write JSON safely so an interruption cannot leave a half-written file."""
    temp_path = path.with_suffix(path.suffix + ".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.flush()
        os.fsync(f.fileno())
    temp_path.replace(path)


def next_unprocessed_pages(pdf_path, output_name, limit=5):
    """Return the next PDF page indexes for a book/output pair."""
    pdf_path = Path(pdf_path)
    output_path = OUTPUT_DIR / output_name
    pdf = pdfium.PdfDocument(str(pdf_path))
    total_pages = len(pdf)
    pdf.close()
    key = str(pdf_path.resolve())
    processed = set(_load_progress(output_path).get(key, []))
    return [i for i in range(total_pages) if i not in processed][:max(1, int(limit))]


def generate_mcqs(image_b64, subject="Biology", model=None):
    prompt = f"""You are an MDCAT exam question writer. The Pakistan Medical & Dental Council (PMDC) MDCAT exam has 81 Biology MCQs (45% weight). The official syllabus has 16 units:

{OFFICIAL_UNITS_STR}

Look at this textbook page and generate MCQs that exactly match the style of real KMU MDCAT past papers.

Here are real past paper examples — match this style EXACTLY:
{FEW_SHOT_JSON}

KEY STYLE RULES:
1. Questions must be SHORT and DIRECT (5-15 words typically)
2. Use fill-in-the-blank with "________" (4+ underscores) when the answer fits at the end or middle
3. Use "?" at the end for direct questions
4. Use "Which is INCORRECT"/"Which of the following does NOT" for negative questions
5. Options must be SHORT — single words or short phrases (not full sentences)
6. Test one specific fact or concept per question
7. Distribute difficulty: ~15% easy, ~70% moderate, ~15% hard
8. Generate 4-6 MCQs per page
9. For each MCQ, identify which official syllabus Unit it belongs to

Output ONLY a valid JSON array, no markdown, no code fences, no extra text.
Required format:
[{{"text":"...", "options":{{"A":"...","B":"...","C":"...","D":"..."}}, "correct":"A", "subject":"{subject}", "unit":<unit_number>}}]"""

    payload = {
        "model": model or MODEL,
        "messages": [
            {"role": "user", "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
            ]}
        ],
        "temperature": 0.2,
        "max_tokens": 4096
    }
    resp = requests.post(API_URL, json=payload, timeout=60)
    if resp.status_code != 200:
        raise Exception(f"API error {resp.status_code}: {resp.text[:300]}")
    data = resp.json()
    text = data["choices"][0]["message"]["content"] or ""
    if not text:
        raise Exception("Empty response from model")
    from json_utils import parse_json_robust
    return parse_json_robust(text)


def process_pdf(pdf_path, output_name=None, pages=None, subject="Biology", model=None,
                source=None, year=0):
    pdf_path = Path(pdf_path)
    if not pdf_path.exists():
        print(f"Error: File not found: {pdf_path}")
        return

    if output_name is None:
        output_name = pdf_path.stem.replace(" ", "_") + "_mcqs.json"
    output_path = OUTPUT_DIR / output_name

    pdf = pdfium.PdfDocument(str(pdf_path))
    total_pages = len(pdf)
    pdf.close()

    progress = _load_progress(output_path)
    progress_key = str(pdf_path.resolve())
    processed_pages = set(progress.get(progress_key, []))

    if isinstance(pages, list):
        page_range = [p for p in pages if 0 <= p < total_pages]
    elif pages:
        page_range = list(range(pages[0], min(pages[1], total_pages) + 1))
    else:
        page_range = list(range(total_pages))
    page_range = [p for p in page_range if p not in processed_pages]

    all_mcqs = []
    seen_questions = set()
    start_index = 0
    mcq_counter = 1

    if output_path.exists():
        with open(output_path, encoding="utf-8") as f:
            existing = json.load(f)
        all_mcqs = existing
        mcq_counter = max(m["number"] for m in existing) + 1 if existing else 1
        seen_questions = {m["text"] for m in existing}

    print(f"Processing: {pdf_path.name}")
    if page_range:
        print(f"Pages: {page_range[0]+1}-{page_range[-1]+1}  |  Subject: {subject}")
    else:
        print("No new pages to process for this book.")
    print(f"Output: {output_path}")
    print()

    for i in range(len(page_range)):
        page_num = page_range[i]
        try:
            print(f"  [{i+1}/{len(page_range)}] Page {page_num+1}... ", end="", flush=True)
            img = render_page(str(pdf_path), page_num)
            b64 = image_to_b64(img)
            mcqs = generate_mcqs(b64, subject, model)
            new_count = 0
            for mcq in mcqs:
                mcq["correct"] = mcq["correct"].upper()
                if mcq["correct"] not in ("A","B","C","D"):
                    continue
                if mcq.get("unit") and isinstance(mcq["unit"], int):
                    mcq["unit_label"] = OFFICIAL_UNITS.get(mcq["unit"], f"Unit {mcq['unit']}")
                if mcq["text"] not in seen_questions:
                    mcq["number"] = mcq_counter
                    mcq.setdefault("source", source or pdf_path.stem)
                    mcq.setdefault("year", year)
                    mcq.setdefault("status", "draft")
                    mcq.setdefault("page", page_num + 1)
                    all_mcqs.append(mcq)
                    seen_questions.add(mcq["text"])
                    mcq_counter += 1
                    new_count += 1

            _save_json_atomic(output_path, all_mcqs)
            processed_pages.add(page_num)
            progress[progress_key] = sorted(processed_pages)
            _save_progress(output_path, progress)
            print(f"{new_count} new (total: {len(all_mcqs)})")

        except Exception as e:
            print(f"FAILED: {e}")
            try:
                time.sleep(2)
                img = render_page(str(pdf_path), page_num)
                b64 = image_to_b64(img)
                mcqs = generate_mcqs(b64, subject, model)
                new_count = 0
                for mcq in mcqs:
                    mcq["correct"] = mcq["correct"].upper()
                    if mcq["correct"] not in ("A","B","C","D"):
                        continue
                    if mcq.get("unit") and isinstance(mcq["unit"], int):
                        mcq["unit_label"] = OFFICIAL_UNITS.get(mcq["unit"], f"Unit {mcq['unit']}")
                    if mcq["text"] not in seen_questions:
                        mcq["number"] = mcq_counter
                        mcq.setdefault("source", source or pdf_path.stem)
                        mcq.setdefault("year", year)
                        mcq.setdefault("status", "draft")
                        mcq.setdefault("page", page_num + 1)
                        all_mcqs.append(mcq)
                        seen_questions.add(mcq["text"])
                        mcq_counter += 1
                        new_count += 1
                _save_json_atomic(output_path, all_mcqs)
                processed_pages.add(page_num)
                progress[progress_key] = sorted(processed_pages)
                _save_progress(output_path, progress)
                print(f"  Retry OK: {new_count} new")
            except Exception as e2:
                print(f"  Retry FAILED: {e2} — skipping page {page_num+1}")

    # Print syllabus coverage summary
    if all_mcqs:
        units_covered = set()
        for m in all_mcqs:
            u = m.get("unit")
            if u and isinstance(u, int):
                units_covered.add(u)
        if units_covered:
            print(f"\nCoverage: {len(units_covered)}/{len(OFFICIAL_UNITS)} syllabus units")
            for u in sorted(units_covered):
                count = sum(1 for m in all_mcqs if m.get("unit") == u)
                print(f"  Unit {u}: {OFFICIAL_UNITS[u]} — {count} MCQs")

    print(f"\nDone! {len(all_mcqs)} MCQs saved to {output_path}")
    return output_path


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Generate MDCAT-style MCQs from textbook PDFs")
    parser.add_argument("pdf", help="Path to the PDF file")
    parser.add_argument("--output", "-o", help="Output JSON filename")
    parser.add_argument("--subject", "-s", default="Biology", help="Subject (default: Biology)")
    parser.add_argument("--source", default=None, help="Source label stored with each MCQ")
    parser.add_argument("--year", type=int, default=0, help="Content/exam year (0 if not applicable)")
    parser.add_argument("--start", type=int, help="Start page (1-indexed)")
    parser.add_argument("--end", type=int, help="End page (1-indexed)")
    args = parser.parse_args()

    pages = None
    if args.start is not None or args.end is not None:
        pages = ((args.start or 1) - 1, (args.end or 9999) - 1)

    process_pdf(args.pdf, args.output, pages, args.subject, source=args.source, year=args.year)
