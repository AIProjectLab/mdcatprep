# Question-bank update workflow

This repository is the published quiz app. The local Python generator remains the book-processing tool because it needs the PDF books and LM Studio. Keep generated output outside the app repository, then sync new questions into the app bank.

## 1. Generate textbook questions

In `questionbank-generator`, start the app with `run_app.bat`. In **Generate from books**, choose **All books** and **Process all remaining pages**. You do not need to know page numbers. Keep the same output filename so progress is remembered.

- **Source label**: for example `Punjab Biology 11th textbook`
- **Content year**: use `0` for textbook content, or the exam year for past papers
- **Output filename**: use a stable name so the generator can resume

New questions are saved with source, year, page metadata, and automatic progress tracking.

## 2. Preview the sync

From `mdcat-app` run:

```powershell
npm run sync:questions -- "questionbank-generator\generated_mcqs\combined_mcqs.json" --source "Punjab Biology 11th textbook" --year 0 --dry-run
```

The command reports incoming, new, and duplicate questions without changing the app.

## 3. Sync without duplicates

Run the same command without `--dry-run`:

```powershell
npm run sync:questions -- "questionbank-generator\generated_mcqs\combined_mcqs.json" --source "Punjab Biology 11th textbook" --year 0
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

Vercel is configured to skip deployments when a commit changes only `questionbank-generator`. Changes to the student app or `src/data/questions.json` still deploy normally.

Never commit PDFs, LM Studio credentials, or Google client-secret files. Review `git status` before committing.
