import type { SupportingArticle } from "@/types/dailyAlpha";
import { describeSourceTrust } from "@/lib/newsSources";

interface NewsArticleListProps {
  articles: SupportingArticle[];
  limit?: number;
}

const SENTIMENT_STYLES: Record<SupportingArticle["sentiment"], string> = {
  Bullish: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Neutral: "bg-slate-50 text-slate-600 ring-slate-200",
  Bearish: "bg-rose-50 text-rose-700 ring-rose-200",
};

const TRUST_BAND_STYLES: Record<
  "Primary" | "High" | "Medium" | "Low" | "Caution",
  string
> = {
  Primary: "bg-purple-50 text-purple-700 ring-purple-200",
  High: "bg-blue-50 text-blue-700 ring-blue-200",
  Medium: "bg-slate-50 text-slate-600 ring-slate-200",
  Low: "bg-amber-50 text-amber-700 ring-amber-200",
  Caution: "bg-rose-50 text-rose-700 ring-rose-200",
};

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NewsArticleList({
  articles,
  limit,
}: NewsArticleListProps) {
  const list = limit ? articles.slice(0, limit) : articles;
  if (list.length === 0) {
    return (
      <p className="text-sm text-slate-400 italic">
        No supporting news articles in this dataset.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {list.map((a, i) => {
        const trust = describeSourceTrust(a.source);
        return (
          <li
            key={`${a.url}-${i}`}
            className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sm sm:text-base text-slate-900 hover:text-blue-700 hover:underline leading-snug flex-1 min-w-0"
              >
                {a.title}
              </a>
              <span
                className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ring-1 whitespace-nowrap ${SENTIMENT_STYLES[a.sentiment]}`}
              >
                {a.sentiment}
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span className="font-medium text-slate-700">{a.source}</span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded-full ring-1 ${TRUST_BAND_STYLES[trust.band]}`}
                title={trust.notes}
              >
                {trust.band} trust · {trust.score}
              </span>
              <span className="text-slate-400">·</span>
              <span>{formatDate(a.publishedDate)}</span>
            </div>
            {a.summary && (
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                {a.summary}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
