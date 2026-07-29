"use client";

import { useState, useEffect, useCallback } from "react";

export default function Timer({
  endTime,
  onTimeUp,
}: {
  endTime: number;
  onTimeUp: () => void;
}) {
  const calcRemaining = useCallback(() => {
    return Math.max(0, endTime - Date.now());
  }, [endTime]);

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = calcRemaining();
      setRemaining(r);
      if (r <= 0) {
        clearInterval(interval);
        onTimeUp();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [calcRemaining, onTimeUp]);

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const isLow = remaining < 300000; // 5 min warning

  return (
    <div
      className={`text-center text-xl font-bold tabular-nums tracking-wider ${
        isLow ? "text-red-600 animate-pulse" : "text-gray-900"
      }`}
    >
      {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
      {String(seconds).padStart(2, "0")}
    </div>
  );
}
