"use client";

import { useState, useEffect, useRef } from "react";
import type { Question } from "@/lib/questions";

export default function QuestionDisplay({
  question,
  selected,
  onSelect,
  showResult,
}: {
  question: Question;
  selected: string | null;
  onSelect: (option: string) => void;
  showResult?: boolean;
}) {
  const options = Object.keys(question.options).sort();
  const prevSelected = useRef<string | null>(null);
  const [tapped, setTapped] = useState<string | null>(null);
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    if (!showResult && selected && selected !== prevSelected.current) {
      setTapped(selected);
      const t = setTimeout(() => setTapped(null), 350);
      prevSelected.current = selected;
      return () => clearTimeout(t);
    }
    prevSelected.current = selected;
  }, [selected, showResult]);

  function getOptionStyle(option: string) {
    const base = "w-full rounded-lg border p-4 text-left transition text-sm";
    const tapClass = tapped === option ? " animate-tap" : "";
    if (!showResult) {
      return selected === option
        ? `${base} border-teal-600 bg-teal-50 text-teal-900 font-medium${tapClass}`
        : `${base} border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50 text-stone-900${tapClass}`;
    }
    if (option === question.answer) {
      return `${base} border-green-500 bg-green-50 text-green-900 font-medium`;
    }
    if (option === selected && option !== question.answer) {
      return `${base} border-red-400 bg-red-50 text-red-900`;
    }
    return `${base} border-stone-200 bg-stone-50 text-stone-500`;
  }

  // Build the source reference line (book/page for textbooks, source/year for past papers)
  const sourceText = (() => {
    if (question.book) {
      return `📖 ${question.book}${question.page ? ` · p.${question.page}` : ""}`;
    }
    if (question.source && question.source !== "Unknown 0") {
      return question.year > 0 ? `${question.source} ${question.year}` : question.source;
    }
    return null;
  })();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-stone-500 mb-2">
          <span className="rounded bg-stone-100 px-2 py-0.5 font-medium">
            Q{question.id}
          </span>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">
            {question.subject}
          </span>
          {/* Source shown only in result mode, behind a toggle */}
          {showResult && sourceText && (
            <button
              onClick={() => setShowSource((s) => !s)}
              className="ml-auto flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2 py-0.5 text-stone-500 hover:bg-stone-50 transition"
              title="Show source"
            >
              <span>ℹ️</span>
              {showSource ? <span>Hide source</span> : <span>Source</span>}
            </button>
          )}
        </div>
        {showResult && showSource && sourceText && (
          <p className="mb-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-600">
            {sourceText}
          </p>
        )}
        <p className="text-base leading-relaxed text-stone-900">{question.text}</p>
      </div>
      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => !showResult && onSelect(opt)}
            disabled={showResult}
            className={getOptionStyle(opt)}
          >
            <span className="font-semibold mr-2">{opt}.</span>
            {question.options[opt]}
          </button>
        ))}
      </div>
      {showResult && question.explanation && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          <strong>Explanation:</strong> {question.explanation}
        </div>
      )}
    </div>
  );
}
