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
        ? `${base} border-emerald-500 bg-emerald-50 text-emerald-900 font-medium${tapClass}`
        : `${base} border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-900${tapClass}`;
    }
    if (option === question.answer) {
      return `${base} border-green-500 bg-green-50 text-green-900 font-medium`;
    }
    if (option === selected && option !== question.answer) {
      return `${base} border-red-400 bg-red-50 text-red-900`;
    }
    return `${base} border-gray-200 bg-gray-50 text-gray-500`;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span className="rounded bg-gray-100 px-2 py-0.5 font-medium">
            Q{question.id}
          </span>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-blue-700">
            {question.subject}
          </span>
          {question.book ? (
            <span className="text-gray-500">
              📖 {question.book}
              {question.page ? ` · p.${question.page}` : ""}
            </span>
          ) : question.source !== "Unknown 0" && question.year > 0 ? (
            <span className="text-gray-400">
              {question.source} {question.year}
            </span>
          ) : question.source !== "Unknown 0" ? (
            <span className="text-gray-400">
              {question.source}
            </span>
          ) : null}
        </div>
        <p className="text-base leading-relaxed text-gray-900">{question.text}</p>
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
