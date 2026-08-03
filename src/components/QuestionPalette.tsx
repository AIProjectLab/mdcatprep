"use client";

import type { Question } from "@/lib/questions";

const SUBJECT_COLORS: Record<string, string> = {
  "Biology": "bg-blue-500",
  "Chemistry": "bg-red-500",
  "Physics": "bg-purple-500",
  "English": "bg-orange-500",
  "Logical Reasoning": "bg-teal-500",
};

export default function QuestionPalette({
  questions,
  answers,
  currentIndex,
  onNavigate,
}: {
  questions: Question[];
  answers: Record<number, string | null>;
  currentIndex: number;
  onNavigate: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-stone-600">Question Palette</h3>

      <div className="flex flex-wrap gap-1">
        {questions.map((q, i) => {
          const answered = answers[q.id] != null;
          const isCurrent = i === currentIndex;
          const subjectColor = SUBJECT_COLORS[q.subject] || "bg-stone-400";
          return (
            <button
              key={q.id}
              onClick={() => onNavigate(i)}
              className={`relative h-7 w-7 rounded text-xs font-medium transition overflow-hidden ${
                isCurrent
                  ? "ring-2 ring-teal-600 ring-offset-1"
                  : ""
              } ${
                answered
                  ? "bg-teal-500 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {/* Subject color stripe at top */}
              <span className={`absolute top-0 left-0 right-0 h-0.5 ${subjectColor}`} />
              <span className="relative z-10">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-stone-500 pt-2 border-t border-stone-100">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-teal-500" /> Answered
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded bg-stone-100 border border-stone-200" /> Unanswered
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 rounded bg-blue-500" /> Biology
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 rounded bg-red-500" /> Chemistry
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 rounded bg-purple-500" /> Physics
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 rounded bg-orange-500" /> English
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 rounded bg-teal-500" /> LR
        </span>
      </div>
    </div>
  );
}
