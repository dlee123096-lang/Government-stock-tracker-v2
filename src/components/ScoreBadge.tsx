import type { ScoreLabel } from "@/types/signal";

const LABEL_STYLES: Record<ScoreLabel, string> = {
  Exceptional: "bg-purple-100 text-purple-800 ring-1 ring-purple-300",
  "Very Strong": "bg-blue-100 text-blue-800 ring-1 ring-blue-300",
  Strong: "bg-green-100 text-green-800 ring-1 ring-green-300",
  Moderate: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  Low: "bg-gray-100 text-gray-600 ring-1 ring-gray-300",
};

interface ScoreBadgeProps {
  label: ScoreLabel;
  size?: "sm" | "md";
}

export default function ScoreBadge({ label, size = "sm" }: ScoreBadgeProps) {
  const sizeClass =
    size === "md" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap ${sizeClass} ${LABEL_STYLES[label]}`}
    >
      {label}
    </span>
  );
}
