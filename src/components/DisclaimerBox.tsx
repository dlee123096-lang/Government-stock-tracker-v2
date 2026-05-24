interface DisclaimerBoxProps {
  variant?: "amber" | "slate";
  className?: string;
}

const DEFAULT_TEXT =
  "This website is for educational and research purposes only. It does not provide financial advice, investment recommendations, or buy/sell signals. Scores are based on public data, mock data, and/or delayed sources and may be wrong. Always do your own research or consult a licensed financial advisor.";

export default function DisclaimerBox({
  variant = "amber",
  className = "",
}: DisclaimerBoxProps) {
  const styles =
    variant === "amber"
      ? "bg-amber-50 border-amber-200 text-amber-900"
      : "bg-slate-50 border-slate-200 text-slate-700";
  return (
    <div
      className={`border rounded-lg p-4 text-sm leading-relaxed ${styles} ${className}`}
    >
      <span className="font-semibold">Disclaimer:</span> {DEFAULT_TEXT}
    </div>
  );
}
