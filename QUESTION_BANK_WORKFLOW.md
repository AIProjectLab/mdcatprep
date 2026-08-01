# Question-bank update workflow

This repository is the published quiz app. The local Python generator remains the draft factory because it needs the PDF books and LM Studio. Keep generated drafts outside the app repository, review them, and sync only approved questions.

## 1. Generate drafts

In `questionbank genrator`, start the app with `run_app.bat`. In **Generate MCQs**, choose the book and page range, then fill in:

- **Source label**: for example `Punjab Biology 11th textbook`
- **Content year**: use `0` for textbook content, or the exam year for past papers
- **Output filename**: use a stable name for the same batch so the generator can resume

New questions are saved as `status: "draft"` with source, year, and page metadata.

## 2. Review drafts

Open the **Review Drafts** tab. Edit the question, four options, correct answer, and status. Only questions marked `approved` should be published. Download the approved JSON file.

## 3. Preview the sync

From `mdcat-app` run:

```powershell
npm run sync:questions -- "..\questionbank genrator\generated_mcqs\combined_mcqs_approved.json" --source "Punjab Biology 11th textbook" --year 0 --dry-run
```

The command reports incoming, new, and duplicate questions without changing the app.

## 4. Sync without duplicates

Run the same command without `--dry-run`:

```powershell
npm run sync:questions -- "..\questionbank genrator\generated_mcqs\combined_mcqs_approved.json" --source "Punjab Biology 11th textbook" --year 0
npm run validate:questions
npm run build
```

The sync is safe to repeat. It identifies duplicates by normalized subject + question text and preserves existing IDs. It converts `correct` to the app's `answer` field and keeps only A-D options.

## 5. Commit and publish

```powershell
git add scripts package.json src/data/questions.json QUESTION_BANK_WORKFLOW.md
git commit -m "Update question bank"
git push origin main
```

Never commit PDFs, LM Studio credentials, or Google client-secret files. Review `git status` before committing.

