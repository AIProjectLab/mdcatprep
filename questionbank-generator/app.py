import streamlit as st
import json
import csv
import io
from pathlib import Path
from generate_mcqs import process_pdf, next_unprocessed_pages
from merge_mcqs import merge_mcqs, summarize, mcq_to_text

st.set_page_config(page_title="MDCAT Question Bank", page_icon="🧠", layout="wide", initial_sidebar_state="expanded")

BOOKS_DIR = Path(__file__).parent / "Books"
PAST_DIR = Path(__file__).parent / "past papers"
OUTPUT_DIR = Path(__file__).parent / "generated_mcqs"
OUTPUT_DIR.mkdir(exist_ok=True)


def get_all_pdfs():
    pdfs = []
    if BOOKS_DIR.exists():
        for prov_dir in sorted(BOOKS_DIR.iterdir()):
            if prov_dir.is_dir():
                for f in sorted(prov_dir.glob("*.pdf")):
                    label = f.name.replace(".pdf", "").replace("(taleem360.com)", "").replace("  ", " ").strip()
                    pdfs.append({"path": str(f), "province": prov_dir.name, "label": label, "size_mb": f.stat().st_size / 1e6})
    return pdfs


def load_existing_mcqs(path):
    if path.exists():
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        # Progress sidecars and other metadata are not question banks.
        if isinstance(data, list):
            return data
        if isinstance(data, dict):
            for key in ("mcqs", "questions", "data"):
                if isinstance(data.get(key), list):
                    return data[key]
    return []


def get_output_files():
    files = []
    for f in sorted(OUTPUT_DIR.glob("*.json")):
        if f.name.endswith(".progress.json"):
            continue
        try:
            n = len(load_existing_mcqs(f))
        except Exception:
            n = 0
        files.append({"name": f.name, "path": str(f), "count": n})
    return files


def get_past_paper_files():
    files = []
    if PAST_DIR.exists():
        for f in sorted(PAST_DIR.glob("*.json")):
            try:
                n = len(load_existing_mcqs(f))
            except Exception:
                n = 0
            files.append({"name": f.name, "path": str(f), "count": n})
    return files


# ---------------- Sidebar ----------------
with st.sidebar:
    st.title("🧠 MDCAT Question Bank")
    st.caption("Generate textbook questions for the student app")

    output_files = get_output_files()
    past_files = get_past_paper_files()
    bank_file = OUTPUT_DIR / "FINAL_QUESTION_BANK.json"
    st.metric("Current bank", len(load_existing_mcqs(bank_file)) if bank_file.exists() else 0)
    st.caption(f"{len(output_files) - (1 if any(f['name'] == 'FINAL_QUESTION_BANK.json' for f in output_files) else 0)} book output file(s)")

    st.divider()
    st.caption("AI: LM Studio at `http://localhost:1234`")

# ---------------- Tabs ----------------
st.title("MDCAT Question Bank")
st.caption("Choose a book, generate the next questions, then update the student app bank.")
tab_gen, tab_bank, tab_browse = st.tabs(["Generate from books", "Update question bank", "View question bank"])

# ============ TAB 1: GENERATE ============
with tab_gen:
    st.info("You do not need to know the book's chapters or page numbers. Choose a book and generate the next batch.")
    col1, col2 = st.columns([1, 2])

    with col1:
        st.subheader("Choose a book")
        all_pdfs = get_all_pdfs()
        provinces = sorted(set(p["province"] for p in all_pdfs))
        sel_provinces = st.multiselect("Province", provinces, default=provinces, help="This only filters the book list.")

        filtered = [p for p in all_pdfs if p["province"] in sel_provinces]
        book_options = {f"[{p['province']}] {p['label']} ({p['size_mb']:.0f}MB)": p for p in filtered}
        all_book_labels = list(book_options.keys())
        book_scope = st.radio("Books to process", ["All books", "Choose books"], horizontal=True,
                              help="All books runs through every selected province and resumes each book automatically.")
        if book_scope == "All books":
            sel_books = all_book_labels
            st.caption(f"{len(sel_books)} book(s) will be processed in sequence.")
        else:
            sel_books = st.multiselect("Choose book(s)", all_book_labels)

        run_mode = st.radio("Run mode", ["Process all remaining pages", "Generate one batch"], horizontal=True,
                            help="Process all remaining pages is the recommended unattended mode. It resumes automatically after interruption.")
        batch_target = st.selectbox("Questions in this batch", [30, 50, 100, 200], index=1,
                                    help="The generator chooses the required pages automatically.")
        batch_pages = max(1, (batch_target + 4) // 5)
        start_page = end_page = 1

        model_options = ["qwen2.5-vl-7b-instruct", "google/gemma-4-12b", "unsloth/gemma-4-e2b-it", "google/gemma-4-12b-qat", "gemma-3-12b-it"]
        model = st.selectbox("LM Studio model", model_options, index=0)

        with st.expander("Technical settings (optional)", expanded=False):
            output_name = st.text_input("Output filename", "combined_mcqs.json", help="Reuse the same filename to continue a batch.")
            source = st.text_input("Source label (optional)", "", help="Leave empty to use the selected book name automatically.")
            year = st.number_input("Content year", 0, 2100, 2026, help="Use 0 for textbook content without an exam year.")

        st.divider()

        st.caption("Selected books: **{}** · Mode: **{}**".format(
            len(sel_books), "all remaining pages" if run_mode == "Process all remaining pages" else f"about {batch_target} questions per book"))

        if st.button("Generate questions", type="primary", use_container_width=True):
            if not sel_books:
                st.error("Select at least one book")
            else:
                progress = st.progress(0, text="Starting...")
                status = st.empty()
                total = len(sel_books)

                for i, book_label in enumerate(sel_books):
                    info = book_options[book_label]
                    status.info(f"Processing ({i+1}/{total}): {info['label']}")
                    pages = None
                    if run_mode == "Generate one batch":
                        pages = next_unprocessed_pages(info["path"], output_name, batch_pages)
                        if not pages:
                            st.success(f"Already complete: {info['label']}")
                            progress.progress((i + 1) / total, text=f"{i+1}/{total} books checked")
                            continue
                    try:
                        subject = "Biology" if "biology" in info["label"].lower() else ("Chemistry" if "chemistry" in info["label"].lower() else ("Physics" if "physics" in info["label"].lower() else "Biology"))
                        out = process_pdf(info["path"], output_name=output_name, pages=pages, subject=subject,
                                          model=model, source=source.strip() or info["label"], year=year)
                    except Exception as e:
                        st.error(f"Failed: {info['label']} — {e}")

                    progress.progress((i + 1) / total, text=f"{i+1}/{total} books done")

                progress.progress(1.0, text="Done!")
                st.success(f"Done! Questions saved to `generated_mcqs/{output_name}`")
                st.info("Next: open **Update question bank**, click the update button, then sync the bank to the student app.")

    with col2:
        st.subheader("What happens automatically")
        st.markdown("- The generator remembers processed pages\n- New questions are added to the same output file\n- Repeated questions are skipped\n- Progress is saved after every page")
        generated_total = len(load_existing_mcqs(OUTPUT_DIR / "combined_mcqs.json"))
        st.metric("Questions in current output", generated_total)

# ============ TAB 3: BUILD QUESTION BANK ============
with tab_bank:
    st.subheader("Update the question bank")
    st.caption("This combines the official past-paper questions with all generated textbook questions and removes duplicates.")

    col_src = st.container()

    with col_src:
        past_files = get_past_paper_files()
        past_defaults = [f["name"] for f in past_files if "MDCAT_MCQs_KMU_2024" in f["name"] or "2765" in f["name"]]
        sel_past = past_defaults or [f["name"] for f in past_files]
        out_files = [f for f in get_output_files() if f["name"] != "FINAL_QUESTION_BANK.json"]
        sel_gen = [f["name"] for f in out_files]
        bank_name = "FINAL_QUESTION_BANK.json"
        st.success(f"Ready to combine {len(sel_past)} past-paper file(s) and {len(sel_gen)} textbook file(s).")

        if st.button("Update question bank", type="primary", use_container_width=True):
            configs = []
            for name in sel_past:
                configs.append({"path": str(PAST_DIR / name), "source": name, "priority": 10})
            for name in sel_gen:
                configs.append({"path": str(OUTPUT_DIR / name), "source": name, "priority": 5})

            if not configs:
                st.error("Select at least one file")
            else:
                final, stats = merge_mcqs(configs, OUTPUT_DIR / bank_name, dedup_by=("text", "options"))
                st.session_state["bank_name"] = bank_name
                st.success(f"Question bank updated: {len(final)} MCQs")

                s = summarize(final)
                c1, c2, c3 = st.columns(3)
                c1.metric("Total MCQs", s["total"])
                c2.metric("Sources", len(s["sources"]))
                c3.metric("Skipped (invalid)", len(stats["skipped"]))

                st.markdown("**Bank summary**")
                for subj, cnt in s["subjects"].items():
                    st.progress(min(cnt / max(s["total"], 1), 1.0), text=f"{subj}: {cnt}")
                st.markdown("**By unit:**")
                for unit, cnt in sorted(s["units"].items(), key=lambda x: -x[1])[:8]:
                    st.write(f"- {unit}: {cnt}")

                if stats["skipped"]:
                    with st.expander(f"Skipped entries ({len(stats['skipped'])})"):
                        for sk in stats["skipped"]:
                            st.write(f"- {sk}")

# ============ TAB 3: BROWSE BANK ============
with tab_browse:
    st.subheader("Browse Question Bank")
    bank_file = st.session_state.get("bank_name", "FINAL_QUESTION_BANK.json")
    bank_path = OUTPUT_DIR / bank_file

    if bank_path.exists():
        mcqs = load_existing_mcqs(bank_path)
        st.metric("Total MCQs", len(mcqs))

        subjects = sorted(set(m.get("subject", "?") for m in mcqs))
        sources = sorted(set(m.get("source", "?") for m in mcqs))

        col_f1, col_f2 = st.columns(2)
        with col_f1:
            sel_subj = st.selectbox("Filter by subject", ["All"] + subjects)
        with col_f2:
            sel_src = st.selectbox("Filter by source", ["All"] + sources)

        filtered = [m for m in mcqs if (sel_subj == "All" or m.get("subject") == sel_subj) and (sel_src == "All" or m.get("source") == sel_src)]

        st.write(f"Showing {len(filtered)} MCQs")
        search = st.text_input("Search questions", "")
        if search:
            filtered = [m for m in filtered if search.lower() in m["text"].lower()]

        for m in filtered:
            with st.expander(f"#{m['number']} — {m['text'][:60]}"):
                st.write(mcq_to_text(m))
                st.caption(f"Source: {m.get('source','?')} | Subject: {m.get('subject','?')} | Unit: {m.get('unit_label','N/A')}")

        # Export options
        st.divider()
        st.markdown("**Export**")
        export_format = st.radio("Format", ["JSON", "Text", "CSV"], horizontal=True)
        if st.button("Download"):
            if export_format == "JSON":
                st.download_button("Download JSON", json.dumps(mcqs, indent=2, ensure_ascii=False), file_name=bank_file, mime="application/json")
            elif export_format == "Text":
                lines = []
                for m in mcqs:
                    lines.append(mcq_to_text(m))
                    lines.append("")
                st.download_button("Download Text", "\n".join(lines), file_name="question_bank.txt", mime="text/plain")
            else:
                import io
                buf = io.StringIO()
                writer = csv.writer(buf)
                writer.writerow(["number", "subject", "text", "correct", "source"])
                for m in mcqs:
                    writer.writerow([m["number"], m.get("subject", ""), m["text"], m["correct"], m.get("source", "")])
                st.download_button("Download CSV", buf.getvalue(), file_name="question_bank.csv", mime="text/csv")
    else:
        st.info("No question bank built yet. Go to **3 · Build bank**.")
