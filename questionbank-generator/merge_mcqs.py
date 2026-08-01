import json
from pathlib import Path

# Official PMDC MDCAT 2025 Biology Syllabus (16 units) - used for unit mapping
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

SUBJECTS = ["Biology", "Chemistry", "Physics", "English", "Logical Reasoning"]


def normalize_text(text):
    if not text:
        return ""
    return " ".join(str(text).lower().split())


def validate_mcq(m, source):
    """Return (is_valid, reason, cleaned_mcq)."""
    # 1. Must have text
    text = m.get("text", "").strip()
    if not text:
        return False, "empty text", None

    # 2. Must have 4 options A-D, no missing/extra
    opts = m.get("options", {})
    if not isinstance(opts, dict):
        return False, "options not a dict", None
    keys = set(opts.keys())
    if keys != {"A", "B", "C", "D"}:
        return False, f"options keys {sorted(keys)} != A-D", None
    for k in "ABCD":
        if not str(opts[k]).strip():
            return False, f"empty option {k}", None

    # 3. Correct answer must be single A-D
    correct = m.get("correct")
    if correct is None:
        return False, "missing correct", None
    correct = str(correct).strip().upper()
    if correct not in ("A", "B", "C", "D"):
        return False, f"invalid correct={m.get('correct')!r}", None

    # 4. Clean up and normalize
    clean = {
        "text": text,
        "options": {k: str(opts[k]).strip() for k in "ABCD"},
        "correct": correct,
        "subject": (m.get("subject") or "Biology").strip(),
        "source": source,
    }
    if m.get("unit") is not None:
        clean["unit"] = m["unit"]
    if m.get("unit_label"):
        clean["unit_label"] = m["unit_label"]
    return True, "ok", clean


def load_file(path):
    """Load a JSON file that is either a list of MCQs or a dict with 'mcqs' key."""
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("mcqs", "questions", "data"):
            if key in data and isinstance(data[key], list):
                return data[key]
    raise ValueError(f"Unknown JSON structure in {path}")


def merge_mcqs(file_configs, output_path, dedup_by=("text", "options")):
    """Merge multiple MCQ files.

    file_configs: list of dicts {path, source, priority}
      - path: str or Path
      - source: label shown in output (e.g., "KMU MDCAT 2024", "KPK Biology 11th")
      - priority: int, higher = wins on conflicts (compiled past papers should be highest)

    dedup_by: tuple of fields used for duplicate detection
      ("text", "options") is safest because Code A/B have same text but shuffled answers
    """
    output_path = Path(output_path)
    merged = {}
    stats = {"valid": 0, "skipped": [], "duplicates": 0, "sources": {}}
    next_number = 1

    # Sort configs by priority so higher priority files overwrite lower
    ordered = sorted(file_configs, key=lambda c: c.get("priority", 0), reverse=True)

    for config in ordered:
        src = config["source"]
        pri = config.get("priority", 0)
        try:
            raw = load_file(config["path"])
        except Exception as e:
            stats["skipped"].append(f"{src}: could not load ({e})")
            continue

        # Generated textbook questions are drafts by default. Only explicitly
        # approved questions may enter the publishable bank.
        if config.get("approved_only"):
            raw = [m for m in raw if m.get("status", "draft") == "approved"]

        if src not in stats["sources"]:
            stats["sources"][src] = {"loaded": 0, "kept": 0}
        stats["sources"][src]["loaded"] += len(raw)

        for m in raw:
            ok, reason, clean = validate_mcq(m, src)
            if not ok:
                stats["skipped"].append(f"{src}: {reason} :: {str(m.get('text',''))[:50]}")
                continue

            # Dedup key
            key_parts = []
            for field in dedup_by:
                if field == "text":
                    key_parts.append(normalize_text(clean["text"]))
                elif field == "options":
                    opts = clean["options"]
                    key_parts.append(json.dumps(opts, sort_keys=True))
                else:
                    key_parts.append(str(clean.get(field, "")))
            key = "|".join(key_parts)

            if key in merged:
                # Duplicate. Higher priority file already processed (or equal).
                # Keep existing unless this has unit info and existing doesn't.
                existing = merged[key]
                if "unit" in clean and "unit" not in existing:
                    existing["unit"] = clean["unit"]
                    existing["unit_label"] = clean.get("unit_label")
                stats["duplicates"] += 1
            else:
                clean["number"] = next_number
                next_number += 1
                merged[key] = clean
                stats["sources"][src]["kept"] += 1

    final = list(merged.values())
    final.sort(key=lambda m: m["number"])

    # Re-number sequentially (in case of gaps from dedup ordering)
    for i, m in enumerate(final, 1):
        m["number"] = i

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(final, f, indent=2, ensure_ascii=False)

    stats["valid"] = len(final)
    return final, stats


def summarize(mcqs):
    """Return summary dict of the merged bank."""
    from collections import Counter
    subjects = Counter(m.get("subject", "?") for m in mcqs)
    sources = Counter(m.get("source", "?") for m in mcqs)
    units = Counter(m.get("unit_label", "Not tagged") for m in mcqs)
    return {
        "total": len(mcqs),
        "subjects": dict(subjects),
        "sources": dict(sources),
        "units": dict(units),
    }


def mcq_to_text(m):
    """Convert one MCQ to readable text (for preview/export)."""
    lines = [m["text"]]
    for k in "ABCD":
        mark = " ✓" if k == m["correct"] else ""
        lines.append(f"  {k}. {m['options'][k]}{mark}")
    return "\n".join(lines)
