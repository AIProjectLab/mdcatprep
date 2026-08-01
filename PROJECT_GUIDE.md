# MDCAT Preparation Project Guide

This file explains the project so it can be resumed later without reconstructing the design from code.

## Purpose

The repository contains two connected systems:

- **Student app:** Next.js MDCAT practice app with sign-in, timed MCQs, navigation, submission, and results.
- **Local generator:** Streamlit + LM Studio tool that creates textbook MCQs from PDF book pages.

Past-paper tests and textbook practice are separate. Past-paper tests use the existing authoritative questions. Textbook Practice uses generated questions synced into the app.

Do not casually change the current LM Studio generation prompt. It is producing the desired MDCAT style; improve persistence, deduplication, validation, and workflow around it instead.

## Important directories

```text
src/app/                         Student pages and test experience
src/app/dashboard/               Test-mode and textbook-practice selection
src/app/test/                    Timed test page
src/app/result/                  Results pages
src/lib/questions.ts             Question types, pools, test generation, scoring
src/data/questions.json          Published question bank used by students
scripts/sync-question-bank.mjs   Safe textbook-bank synchronizer
scripts/validate-questions.mjs   Published-bank validator
questionbank-generator/          Local Streamlit/LM Studio generator
QUESTION_BANK_WORKFLOW.md        Short operational workflow
PROJECT_GUIDE.md                 This reference
vercel.json                      Vercel deployment ignore rule
```

Inside `questionbank-generator`:

```text
app.py                           Streamlit UI
generate_mcqs.py                PDF rendering, LM Studio calls, resume logic
merge_mcqs.py                   Merge and deduplication
json_utils.py                   Robust JSON parsing
run_app.bat                     Starts the local generator
Books/                           Local PDFs; ignored by Git
generated_mcqs/                  Local generated output; ignored by Git
*.progress.json                 Per-output progress; ignored by Git
```

Books, PDFs, generated bulk JSON, progress files, `.kilo`, `.env`, and secrets must not be committed.

## Generator workflow

1. Start LM Studio and load the vision model.
2. Run `questionbank-generator\run_app.bat`.
3. Open **Generate from books**.
4. Select **All books**.
5. Select **Process all remaining pages**.
6. Click **Generate questions** once.

The generator processes all selected books sequentially. It does not require you to know chapter names or page numbers.

After every successful page it saves the output and records that page in a `.progress.json` sidecar. If there is a power failure, LM Studio disconnects, Windows restarts, or the process stops, start the generator again and click **Generate questions**. It resumes from the last recorded page for each book.

Use **Generate one batch** with 30, 50, 100, or 200 approximate questions when you want a short test run. Keep the same output filename when resuming.

The generator uses the local LM Studio endpoint:

```text
http://localhost:1234/v1/chat/completions
```

It saves after each page and uses atomic JSON writes so an interruption cannot leave a half-written question file. Malformed model responses are skipped instead of stopping the whole run.

## Local bank update

In the generator, open **Update question bank** and click **Update question bank**. It automatically combines authoritative past-paper files and generated textbook files, excludes the existing final output from its own inputs, and removes duplicates.

Typical files:

- `combined_mcqs.json` — generated textbook questions.
- `combined_mcqs.progress.json` — page progress, not questions.
- `FINAL_QUESTION_BANK.json` — local merged bank.

## Publish textbook questions to the student app

The student app reads `src/data/questions.json`. From the `mdcat-app` directory, preview first:

```powershell
npm run sync:questions -- "questionbank-generator\generated_mcqs\combined_mcqs.json" --source "Generated textbook MCQs" --year 0 --dry-run
```

Then apply and validate:

```powershell
npm run sync:questions -- "questionbank-generator\generated_mcqs\combined_mcqs.json" --source "Generated textbook MCQs" --year 0
npm run validate:questions
npm run build
```

The synchronizer converts `correct` to `answer`, adds `origin: "textbook"`, preserves source/year/unit metadata, assigns IDs, skips duplicate normalized subject + question text, and skips malformed incoming entries while reporting them. It is safe to run repeatedly.

Do not sync `FINAL_QUESTION_BANK.json` as textbook input because it also contains past-paper questions. Sync generated textbook output instead.

## Student app modes

Existing modes: Free Diagnostic, Full Test, Half Test, Quick Practice, and Daily Challenge.

The added **Textbook Practice** mode lets students choose 30, 50, 90, or 180 MCQs, select Biology/Chemistry/Physics or all subjects, and select all textbook sources or a specific book/source.

Textbook selection uses only questions with `origin: "textbook"`; existing past-paper questions remain in the past-paper pool.

## Data formats

Generator format uses `correct`:

```json
{"text":"Sugarcane contains ________","options":{"A":"Fructose","B":"Glucose","C":"Ribose","D":"Sucrose"},"correct":"D","subject":"Biology","unit":3}
```

Published app format uses `answer` and adds identity/provenance:

```json
{"id":1300,"subject":"Biology","year":0,"source":"Biology 11th Class Book","origin":"textbook","text":"Sugarcane contains ________","options":{"A":"Fructose","B":"Glucose","C":"Ribose","D":"Sucrose"},"answer":"D","unit":3}
```

## Checks

After app or bank changes:

```powershell
npm run validate:questions
npm run build
```

After generator changes:

```powershell
py -m py_compile questionbank-generator\app.py questionbank-generator\generate_mcqs.py questionbank-generator\merge_mcqs.py questionbank-generator\json_utils.py
```

## GitHub and Vercel

Remote: `https://github.com/AIProjectLab/mdcatprep.git`

Normal release commands:

```powershell
git status
git add src scripts package.json QUESTION_BANK_WORKFLOW.md PROJECT_GUIDE.md
git commit -m "Update textbook question bank"
git push origin main
```

`vercel.json` tells Vercel to skip a deployment when a commit changes only `questionbank-generator`. `.vercelignore` excludes the generator and local PDFs from the deployment upload. Changes to `src/app`, `src/lib`, `scripts`, or `src/data/questions.json` still deploy normally.

## Pitfalls

- Do not manually replace `src/data/questions.json`; use the sync script.
- Do not change the output filename when you intend to resume.
- Monitor the invalid count from sync; a model can return incomplete options.
- Syllabus coverage counts represented units; it does not guarantee equal coverage.
- If LM Studio is not running at port 1234, generation fails while the student app remains unaffected.
- The canonical generator location is `mdcat-app/questionbank-generator`.

## Current state

- Published app bank: 1,271 validated questions.
- Textbook-origin questions already synced: 42.
- Textbook Practice mode is available in the dashboard.
- Generator supports all-book sequential processing and per-book resume.
- Vercel ignores generator-only commits.
