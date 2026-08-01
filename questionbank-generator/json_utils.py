import json
import re


def parse_json_robust(text):
    """Parse JSON from LLM output, tolerating common malformations.

    Returns a list of MCQs (dicts). Raises ValueError if nothing usable found.
    """
    if not text:
        raise ValueError("Empty text")

    # 1. Try direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # 2. Strip markdown code fences
    cleaned = text.strip()
    cleaned = re.sub(r'^```(?:json)?\s*', '', cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r'\s*```$', '', cleaned, flags=re.MULTILINE).strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 3. Extract the outermost [...] array (in case there is surrounding prose)
    start = cleaned.find('[')
    end = cleaned.rfind(']')
    if start != -1 and end != -1 and end > start:
        candidate = cleaned[start:end + 1]
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass

    # 4. Fix trailing commas (common in LLM JSON)
    for candidate in [cleaned,
                      cleaned[start:end + 1] if 'start' in dir() and start != -1 and end != -1 and end > start else cleaned]:
        if not candidate.strip().startswith('['):
            continue
        fixed = re.sub(r',\s*}', '}', candidate)          # {...,} -> {...}
        fixed = re.sub(r',\s*]', ']', fixed)              # [...,] -> [...]
        try:
            return json.loads(fixed)
        except json.JSONDecodeError:
            pass

    # 5. Try to salvage individual MCQ objects with regex as a last resort
    salvaged = _salvage_objects(cleaned)
    if salvaged:
        return salvaged

    # 6. Single-quoted JSON (common LLM slip) — convert to double quotes carefully
    try:
        conv = _convert_single_quotes(cleaned)
        obj = json.loads(conv)
        return obj
    except (json.JSONDecodeError, ValueError):
        pass

    raise ValueError(f"Could not parse JSON. First 300 chars: {text[:300]!r}")


def _convert_single_quotes(text):
    """Best-effort conversion of single-quoted JSON to double-quoted JSON."""
    # Replace single-quoted keys and string values with double quotes,
    # but leave apostrophes inside words alone (e.g., "don't").
    out = []
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch == "'":
            # Determine if it opens a string (preceded by , : [ or start)
            prev = out[-1] if out else ''
            if prev in ('', ' ', '[', ':', ',', '{'):
                # find closing quote
                j = i + 1
                buf = []
                while j < n:
                    if text[j] == "'":
                        # check for doubled '' (escaped quote)
                        if j + 1 < n and text[j+1] == "'":
                            buf.append("'")
                            j += 2
                            continue
                        break
                    buf.append(text[j])
                    j += 1
                out.append('"' + ''.join(buf) + '"')
                i = j + 1
                continue
        out.append(ch)
        i += 1
    return ''.join(out)


def _salvage_objects(text):
    """Last-resort: extract {..} blocks that look like MCQs and parse each one."""
    results = []
    # find balanced braces
    for m in re.finditer(r'\{', text):
        depth = 0
        for i in range(m.start(), min(len(text), m.start() + 6000)):
            ch = text[i]
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    block = text[m.start():i + 1]
                    try:
                        fixed = re.sub(r',\s*}', '}', block)
                        fixed = re.sub(r',\s*]', ']', fixed)
                        obj = json.loads(fixed)
                        if isinstance(obj, dict) and 'text' in obj and 'options' in obj:
                            results.append(obj)
                    except json.JSONDecodeError:
                        pass
                    break
    return results
