# MDCAT MCQ Generator

Automatically generate **MDCAT-style MCQs** from scanned textbook PDFs using **Gemini Vision AI** — no OCR required.

- **Input:** Any scanned textbook PDF (tested with KPK FSC Biology 11th & 12th)
- **Output:** JSON MCQs matching real KMU MDCAT past papers, tagged by official PMDC syllabus unit
- **Speed:** ~5-6 MCQs per page, ~1 min/page
- **Accuracy:** Vision AI reads images directly — diagrams, tables, mixed text all handled

---

## Project Background

This project was built to solve a specific problem:

- We have **KPK FSC Biology textbooks** (11th and 12th class by Muhammad Ali) in PDF format
- We have **real KMU MDCAT past papers** (2024-2025) as reference data
- We needed to generate **practice MCQs** from the textbooks that match the **exact style** of the real past papers
- The PDFs are **scanned images** — standard text extraction (`pypdf`, `pdfplumber`) returns nothing useful
- Traditional **OCR (Tesseract)** produced ~40% accurate garbled text — unusable for MCQ generation

The solution: send the PDF page **images directly** to a Vision LLM, skipping OCR entirely.

---

## Files & Directory Structure

```
E:\PMDC test\questionbank genrator\
│
├── generate_mcqs.py              # Main application (the core generator)
├── README.md                     # This file
│
├── Fsc bio books pdf kpk\        # Source textbooks (scanned PDFs)
│   ├── Biology 11th Class Book By Muhammad Ali.pdf    (350 pages)
│   └── Biology 12th Class Book By Muhammad Ali .pdf   (367 pages)
│
├── Official-Syllabus\            # PMDC official documents
│   ├── Uniform Curriculum MDCAT-2025 Final (26-05-2025).pdf
│   └── syllabus_text.txt         (extracted text version)
│
├── Public-Notices\               # PMDC official announcements
│   ├── Public Notice Regarding MDCAT-2026 Date Announcement.pdf
│   └── Public Notice Regarding Opening of Online Registration Portal for MDCAT-2026.pdf
│
├── past papers\                  # Real KMU MDCAT past papers (reference data)
│   ├── MDCAT_MCQs_KMU_2024_2026-07-27.json              (122+ MCQs, compiled)
│   ├── 2456-KMU_MDCAT_Paper_2024_PDF_with_Answers_Key_Code_A...json  (Code A)
│   ├── 2457-KMU_MDCAT_2024_Original_Paper_PDF_with_Answers_Code_B...json  (Code B)
│   └── 2765-KMU_MDCAT_2025_Paper_PDF_with_Answer_Key...json  (2025 paper)
│
└── generated_mcqs\               # Output folder (created on first run)
    └── Biology_11th_Class_Book_By_Muhammad_Ali_mcqs.json
```

---

## How It Works (Step by Step)

### Step 1: Page Rendering

`pypdfium2` opens the PDF and renders each page as a PNG image at 1.5x scale. This works on scanned PDFs because the scanner embeds images inside the PDF container — we extract those images.

```python
pdf = pdfium.PdfDocument(pdf_path)
page = pdf[page_num]
bitmap = page.render(scale=1.5)
img = bitmap.to_pil()  # → PIL Image object
```

### Step 2: API Call to Gemini

The PNG image is base64-encoded and sent to **Gemini 2.5 Flash** along with a carefully engineered prompt. The prompt contains:

1. **13 real KMU past paper MCQs** as few-shot examples (so the output matches the exact style)
2. **The full 16-unit official PMDC syllabus** (so Gemini knows which unit each MCQ belongs to)
3. **Style rules**: short questions, `________` blanks, "INCORRECT" negation, single-word options
4. **Difficulty distribution**: 15% Easy / 70% Moderate / 15% Hard

### Step 3: Parse & Save

The API returns a JSON array of MCQs. The script:
- Validates the `correct` field is A/B/C/D
- Normalizes it to uppercase
- Maps the `unit` number (1-16) to a human-readable `unit_label`
- Removes duplicates (by question text)
- Assigns sequential `number` IDs
- Saves incrementally after each page (so progress isn't lost if interrupted)

---

## Official PMDC MDCAT 2025 Syllabus (Biology)

The PMDC MDCAT exam has **81 Biology MCQs** out of 180 total (45% weight). The official syllabus defines **16 units**:

| # | Unit Name | Topics Covered |
|---|-----------|----------------|
| 1 | **Acellular Life** | Viruses (structure/classification), AIDS & HIV infection |
| 2 | **Bioenergetics** | Cellular respiration of proteins, fats, and glucose |
| 3 | **Biological Molecules** | Water (properties), carbohydrates, proteins, lipids, RNA, DNA structure, conjugated molecules |
| 4 | **Cell Structure & Function** | Animal vs plant cell, prokaryotic vs eukaryotic, cytoplasmic organelles, chromosomes |
| 5 | **Coordination & Control** | Receptors, neurons, nerve impulse, reflexes, reflex arc, brain parts |
| 6 | **Enzymes** | Characteristics, mechanism, factors affecting rate, inhibitors |
| 7 | **Evolution** | Origin of life, Lamarckism, Darwinism, natural selection |
| 8 | **Reproduction** | Male & female reproductive systems, menstrual cycle, STDs |
| 9 | **Support & Movement** | Cartilage, bone, muscle types, skeletal muscle ultrastructure, contraction, joints, arthritis |
| 10 | **Inheritance** | Mendel's laws, gene linkage, crossing over, X-linked recessive inheritance, hemophilia |
| 11 | **Circulation** | Human heart, cardiac cycle, blood vessels, lymphatic system |
| 12 | **Immunity** | Specific defense mechanisms |
| 13 | **Respiration** | Human respiratory system, gas exchange, effects of smoking |
| 14 | **Digestion** | Human digestive system parts and functions |
| 15 | **Homeostasis** | Urinary system, kidney (filtration/reabsorption/secretion), thermoregulation, excretion |
| 16 | **Biotechnology** | Vaccines, DNA/RNA probes, monoclonal antibodies, disease treatment |

### PMDC MDCAT Test Structure

| Subject | MCQs | Weight | Time |
|---------|------|--------|------|
| Biology | 81 | 45% | |
| Chemistry | 45 | 25% | |
| Physics | 36 | 20% | |
| English | 9 | 5% | 3 hours total |
| Logical Reasoning | 9 | 5% | |
| **Total** | **180** | **100%** | |

- **Minimum pass (Medical):** 55%
- **Minimum pass (Dental):** 50%
- **No negative marking**
- **Paper-based MCQs**
- **Difficulty:** 15% Easy, 70% Moderate, 15% Hard

### MDCAT 2026 Key Dates (from Public Notices)

- **Exam Date:** Sunday, 16 August 2026
- **Registration Opens:** 22 June 2026 (normal fee PKR 9,000)
- **Registration Closes:** 8 July 2026
- **Late Registration:** Until 13 July 2026 (PKR 13,000)
- **Syllabus:** Same as MDCAT 2025
- **Conducting Universities:** KMU (KPK), UHS Lahore (Punjab), Sukkur IBA (Sindh), Bolan University (Balochistan), SZABMU Islamabad (ICT/AJK/Gilgit)

---

## Past Papers Style Analysis

The 122+ real KMU MDCAT MCQs in `past papers/` were analyzed to extract these style patterns:

### Question Style

- **Short & direct** (5-15 words): `"Sugarcane contains ________"`, `"A motor neuron:"`
- **Fill-in-the-blank** with `________`: `"The ________ in semen facilitate the transport of sperms."`
- **Direct question with ?**: `"Sickle cell anaemia results from?"`, `"Where are spindle fibres attached on a chromosome during cell division"`
- **Negation**: `"Which is INCORRECT about the globular proteins?"`, `"Which of the following does NOT relate to smooth muscles?"`

### Options Style

- **Single words or short phrases** only: e.g., `"Centromere"`, `"7"`, `"Sucrose"`, `"DNA and protein"`
- **Never full sentences** — the real past papers avoid long descriptive options
- Plausible distractors that are related to the topic

### Subject Coverage in Real Papers

The past papers cover Biology (majority), Chemistry, and Physics. Biology questions span units 1-16 of the PMDC syllabus.

### Answer Key Format

- The compiled set (`MDCAT_MCQs_KMU_2024_2026-07-27.json`) uses **uppercase** `"correct": "A"`
- Some raw papers use **lowercase** `"correct": "a"` — the app normalizes to uppercase

---

## Why Vision AI Instead of OCR?

This was tested and proven:

| Method | Result |
|--------|--------|
| `pypdf.extract_text()` | Blank/watermark only (scanned PDF) |
| `pdfplumber` | Same — no selectable text |
| **Tesseract OCR** | ~40% accuracy — garbled: `"f proteins also called as �permcases�"` |
| **Gemini 2.5 Flash Vision** | ✅ Perfect — reads the image like a human, outputs clean MCQs |

The Vision model also handles:
- **Diagrams** (cell diagrams, flowcharts)
- **Tables** (data tables, comparison tables)
- **Mixed content** (Urdu labels, English text, scientific notation)
- **Imperfect scans** (slightly skewed, low contrast)

---

## Output Format

Every generated MCQ has these fields:

```json
{
  "number": 45,
  "text": "________ is a metabolic pathway that occurs in the cytosol.",
  "options": {
    "A": "Kreb's cycle",
    "B": "Glycolysis",
    "C": "Electron transport chain",
    "D": "Photosynthesis"
  },
  "correct": "B",
  "subject": "Biology",
  "unit": 2,
  "unit_label": "Bioenergetics (Respiration)"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `number` | int | Sequential ID (auto-incrementing across runs) |
| `text` | string | Question stem (may contain `________` for blanks) |
| `options` | object | Map of A-D to answer choices |
| `correct` | string | Uppercase letter: A, B, C, or D |
| `subject` | string | Subject name (Biology, Chemistry, Physics) |
| `unit` | int | PMDC syllabus unit number (1-16 for Biology) |
| `unit_label` | string | Human-readable unit name |

---

## Usage

### Basic Commands

```bash
# Generate from entire book
python generate_mcqs.py "Fsc bio books pdf kpk/Biology 11th Class Book By Muhammad Ali.pdf"

# Specific chapter (by page range)
python generate_mcqs.py "Fsc bio books pdf kpk/Biology 11th Class Book By Muhammad Ali.pdf" --start 10 --end 40

# Custom output name
python generate_mcqs.py "Fsc bio books pdf kpk/Biology 11th Class Book By Muhammad Ali.pdf" --output chapter_1.json

# Merge into existing past papers file
python generate_mcqs.py "Fsc bio books pdf kpk/Biology 11th Class Book By Muhammad Ali.pdf" --output "../past papers/MDCAT_MCQs_KMU_2024_2026-07-27.json"

# Process Biology 12th book
python generate_mcqs.py "Fsc bio books pdf kpk/Biology 12th Class Book By Muhammad Ali .pdf" --subject Biology
```

### Options Reference

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--start N` | | (first page) | Start page, 1-indexed |
| `--end N` | | (last page) | End page, 1-indexed |
| `--subject` | `-s` | Biology | Subject name for output |
| `--output` | `-o` | `<pdf_name>_mcqs.json` | Output filename (goes in `generated_mcqs/`) |

---

## Built-in Features

| Feature | How It Works |
|---------|-------------|
| **Auto-resume** | If the script is interrupted, it reads the existing output file and continues from where it left off (by detecting which pages have been processed) |
| **Deduplication** | Tracks all question `text` values in a set — skips any duplicate generated across pages |
| **Retry on failure** | On API error, waits 5 seconds and retries once per page before skipping |
| **Syllabus coverage report** | After completion, prints how many of the 16 official units were covered and how many MCQs per unit |
| **Incremental saving** | Saves to JSON after each page — no data lost if the script crashes mid-run |
| **Difficulty distribution** | Instructs Gemini to follow 15% Easy / 70% Moderate / 15% Hard |

---

## Performance Benchmarks

| Metric | Value |
|--------|-------|
| MCQs per page | ~5-6 |
| Time per page | ~40-60 seconds |
| Cost per book | ~$0.10-0.30 (Gemini 2.5 Flash) |
| Biology 11th (350 pages) | ~1800-2100 MCQs in ~5-6 hours |
| Biology 12th (367 pages) | ~1800-2200 MCQs in ~6-7 hours |

---

## Technical Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | Python | 3.11 |
| PDF rendering | `pypdfium2` | 4.30+ |
| Vision API | `google-generativeai` (Gemini 2.5 Flash) | 0.7+ |
| API transport | `requests` | (direct REST, not SDK) |

### Why Direct REST Instead of SDK?

The script uses `requests.post()` directly to the Gemini API endpoint rather than the `google-generativeai` Python SDK because:
- More control over the payload (especially image base64 encoding)
- Easier error handling and debugging
- No SDK dependency issues / version conflicts
- Works with any API key format

---

## Future Improvements

If continuing development:

- [ ] **Streamlit web UI** — drag-and-drop PDF, select pages, click generate
- [ ] **Chemistry & Physics prompts** — replicate the few-shot approach for other subjects
- [ ] **Multi-page context** — send 2-3 pages at once so Gemini sees chapter flow
- [ ] **Batch processing** — process multiple PDFs in sequence
- [ ] **Quiz export** — export to Anki, Quizlet, or other flashcard formats
- [ ] **Difficulty tracking** — track easy/moderate/hard distribution in the output
- [ ] **Chapter auto-detection** — detect chapter headings from images to auto-split

---

## Recommended daily workflow

1. Select a book and use **Next batch**; you do not need to know page numbers.
2. Keep the same output filename so the generator remembers progress.
3. Use **Complete book** when you want to process all remaining pages.
4. Build the combined bank and run the sync command documented in `mdcat-app/QUESTION_BANK_WORKFLOW.md`.
5. Run validation and build before committing the updated quiz bank.

The generator now stores `source`, `year`, `page`, and `status` metadata. This makes it possible to trace a published question back to its generated batch and avoid blindly publishing every AI result.

## Notes

- The API key is embedded in `generate_mcqs.py` — replace it if you get a new one
- Output JSON is fully compatible with the existing past papers JSON schema
- The syllabus text (`syllabus_text.txt`) was extracted from the official PMDC PDF since that PDF is text-based (not scanned)
- Public notices confirm the MDCAT 2026 syllabus is identical to 2025
