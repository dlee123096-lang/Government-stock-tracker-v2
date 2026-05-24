"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Range = "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "Max";

const RANGES: Range[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y", "Max"];

const RANGE_API: Record<Range, string> = {
  "1D": "1d",
  "5D": "5d",
  "1M": "1mo",
  "6M": "6mo",
  "YTD": "ytd",
  "1Y": "1y",
  "5Y": "5y",
  "Max": "max",
};

interface ChartData {
  timestamps: number[];
  closes: number[];
  currentPrice: number;
  previousClose: number;
  currency: string;
}

function parseYahooResponse(json: unknown): ChartData | null {
  try {
    const result = (
      json as {
        chart: {
          result: Array<{
            meta: {
              regularMarketPrice: number;
              previousClose: number;
              chartPreviousClose: number;
              currency: string;
            };
            timestamp: number[];
            indicators: { quote: Array<{ close: (number | null)[] }> };
          }>;
        };
      }
    ).chart.result?.[0];

    if (!result) return null;

    const raw = result.indicators.quote[0].close;
    const ts = result.timestamp;
    const pairs: { t: number; c: number }[] = [];

    for (let i = 0; i < ts.length; i++) {
      const c = raw[i];
      if (c !== null && c !== undefined && !isNaN(c)) {
        pairs.push({ t: ts[i], c });
      }
    }

    if (pairs.length < 2) return null;

    return {
      timestamps: pairs.map((p) => p.t),
      closes: pairs.map((p) => p.c),
      currentPrice:
        result.meta.regularMarketPrice ?? pairs[pairs.length - 1].c,
      previousClose:
        result.meta.chartPreviousClose ??
        result.meta.previousClose ??
        pairs[0].c,
      currency: result.meta.currency ?? "USD",
    };
  } catch {
    return null;
  }
}

function fmtPrice(p: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(p);
}

function fmtTs(ts: number, opts: Intl.DateTimeFormatOptions): string {
  return new Date(ts * 1000).toLocaleDateString("en-US", opts);
}

function xAxisLabels(timestamps: number[], range: Range): string[] {
  if (timestamps.length < 2) return [];
  const n = timestamps.length;
  const idxs = [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((n * 3) / 4), n - 1];
  const shortOpts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const longOpts: Intl.DateTimeFormatOptions = { month: "short", year: "2-digit" };
  const opts =
    range === "1D" || range === "5D" || range === "1M" ? shortOpts : longOpts;
  return idxs.map((i) => fmtTs(timestamps[i], opts));
}

// Chart SVG dimensions
const W = 800;
const H = 180;

interface StockChartProps {
  ticker: string;
  tradeDate?: string;
  tradeType?: "Buy" | "Sell";
}

export default function StockChart({
  ticker,
  tradeDate,
  tradeType,
}: StockChartProps) {
  const [range, setRange] = useState<Range>("1Y");
  const [data, setData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setHoveredIdx(null);

    fetch(`/api/stock/${encodeURIComponent(ticker)}?range=${RANGE_API[range]}`)
      .then((r) => {
        if (!r.ok) throw new Error("upstream");
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        const parsed = parseYahooResponse(json);
        if (!parsed) setError(true);
        else setData(parsed);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ticker, range]);

  // Pre-compute all chart geometry when data changes
  const geo = useMemo(() => {
    if (!data || data.closes.length < 2) return null;
    const { closes, timestamps } = data;
    const n = closes.length;

    const minP = Math.min(...closes);
    const maxP = Math.max(...closes);
    const priceRange = maxP - minP || 1;
    const pad = priceRange * 0.06;
    const lo = minP - pad;
    const hi = maxP + pad;
    const span = hi - lo;

    const xOf = (i: number) => (i / (n - 1)) * W;
    const yOf = (p: number) => H - ((p - lo) / span) * H;

    const pts = closes
      .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(p).toFixed(1)}`)
      .join(" ");
    const linePath = pts;
    const fillPath = `${pts} L${W},${H} L0,${H} Z`;

    // Y-axis label prices
    const yLabels = [hi, (hi + lo) / 2, lo];

    // Trade date marker index
    let tradeIdx: number | null = null;
    if (tradeDate) {
      const tradeDateSec = new Date(tradeDate + "T12:00:00Z").getTime() / 1000;
      let closest = Infinity;
      timestamps.forEach((ts, i) => {
        const diff = Math.abs(ts - tradeDateSec);
        if (diff < closest) {
          closest = diff;
          tradeIdx = i;
        }
      });
      // Only mark if within 7 days of an actual data point
      if (closest > 7 * 24 * 3600) tradeIdx = null;
    }

    return { xOf, yOf, linePath, fillPath, yLabels, tradeIdx, n };
  }, [data, tradeDate]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!data || !chartAreaRef.current) return;
      const rect = chartAreaRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const idx = Math.round(
        Math.max(0, Math.min(1, x)) * (data.closes.length - 1),
      );
      setHoveredIdx(idx);
    },
    [data],
  );

  const handleMouseLeave = useCallback(() => setHoveredIdx(null), []);

  // What to show in the price header (hover overrides current)
  const activeIdx = hoveredIdx ?? (data ? data.closes.length - 1 : null);
  const displayPrice =
    data && activeIdx !== null ? data.closes[activeIdx] : data?.currentPrice;
  const displayTs =
    data && activeIdx !== null ? data.timestamps[activeIdx] : null;

  const basePrice = data?.previousClose ?? data?.closes[0] ?? 1;
  const priceChange = displayPrice !== undefined ? displayPrice - basePrice : 0;
  const pctChange = basePrice !== 0 ? (priceChange / basePrice) * 100 : 0;
  const isUp = priceChange >= 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Price header + range tabs */}
      <div className="px-5 pt-5 pb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            {ticker} · Price Performance
          </p>
          {loading ? (
            <div className="mt-2 h-7 w-40 bg-slate-100 animate-pulse rounded" />
          ) : error ? (
            <p className="mt-2 text-sm text-slate-400">
              Price data unavailable
            </p>
          ) : (
            <div className="mt-1 flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {displayPrice !== undefined
                  ? fmtPrice(displayPrice, data?.currency ?? "USD")
                  : "—"}
              </span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  isUp ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {isUp ? "+" : ""}
                {pctChange.toFixed(2)}%
              </span>
              {displayTs && (
                <span className="text-xs text-slate-400">
                  {fmtTs(displayTs, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Range selector */}
        <div className="flex gap-1 flex-wrap">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                range === r
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Chart body */}
      {loading ? (
        <div className="mx-5 mb-5 h-52 bg-slate-50 animate-pulse rounded-lg" />
      ) : error || !data || !geo ? (
        <div className="mx-5 mb-5 h-52 flex items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
          Price data temporarily unavailable for {ticker}
        </div>
      ) : (
        <div className="pb-2">
          <div className="flex">
            {/* Y-axis labels */}
            <div className="w-14 flex flex-col justify-between items-end pr-2 py-1 flex-shrink-0">
              {geo.yLabels.map((p, i) => (
                <span key={i} className="text-[10px] text-slate-400 tabular-nums leading-none">
                  {p >= 1000
                    ? `$${(p / 1000).toFixed(1)}k`
                    : `$${p.toFixed(0)}`}
                </span>
              ))}
            </div>

            {/* SVG chart */}
            <div
              ref={chartAreaRef}
              className="flex-1 h-48 relative cursor-crosshair select-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <svg
                viewBox={`0 0 ${W} ${H}`}
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
              >
                <defs>
                  <linearGradient
                    id={`fill-${ticker}-${range}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#2563EB" stopOpacity="0.18" />
                    <stop
                      offset="100%"
                      stopColor="#2563EB"
                      stopOpacity="0.01"
                    />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines (3) */}
                {[0.25, 0.5, 0.75].map((f) => (
                  <line
                    key={f}
                    x1="0"
                    y1={(f * H).toFixed(1)}
                    x2={W}
                    y2={(f * H).toFixed(1)}
                    stroke="#e2e8f0"
                    strokeWidth="0.5"
                  />
                ))}

                {/* Fill area */}
                <path
                  d={geo.fillPath}
                  fill={`url(#fill-${ticker}-${range})`}
                />

                {/* Price line */}
                <path
                  d={geo.linePath}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="1.5"
                />

                {/* Trade date marker (amber dashed) */}
                {geo.tradeIdx !== null && (
                  <>
                    <line
                      x1={geo.xOf(geo.tradeIdx).toFixed(1)}
                      y1="0"
                      x2={geo.xOf(geo.tradeIdx).toFixed(1)}
                      y2={H}
                      stroke="#F59E0B"
                      strokeWidth="1.5"
                      strokeDasharray="5,4"
                    />
                    <circle
                      cx={geo.xOf(geo.tradeIdx).toFixed(1)}
                      cy={geo.yOf(data.closes[geo.tradeIdx]).toFixed(1)}
                      r="4"
                      fill="#F59E0B"
                      stroke="white"
                      strokeWidth="1.5"
                    />
                  </>
                )}

                {/* Hover crosshair */}
                {hoveredIdx !== null && (
                  <>
                    <line
                      x1={geo.xOf(hoveredIdx).toFixed(1)}
                      y1="0"
                      x2={geo.xOf(hoveredIdx).toFixed(1)}
                      y2={H}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      strokeDasharray="3,3"
                    />
                    <circle
                      cx={geo.xOf(hoveredIdx).toFixed(1)}
                      cy={geo.yOf(data.closes[hoveredIdx]).toFixed(1)}
                      r="3.5"
                      fill="#2563EB"
                      stroke="white"
                      strokeWidth="2"
                    />
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between pl-14 pr-1 mt-1">
            {xAxisLabels(data.timestamps, range).map((label, i) => (
              <span key={i} className="text-[10px] text-slate-400 tabular-nums">
                {label}
              </span>
            ))}
          </div>

          {/* Trade date legend */}
          {geo.tradeIdx !== null && tradeDate && (
            <div className="pl-14 pr-2 mt-2 flex items-center gap-2">
              <svg width="20" height="8" aria-hidden>
                <line
                  x1="0"
                  y1="4"
                  x2="20"
                  y2="4"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="4,3"
                />
              </svg>
              <span className="text-xs font-medium text-amber-600">
                {tradeType === "Sell" ? "Sold" : "Bought"}
              </span>
              <span className="text-xs text-slate-500">
                {new Date(tradeDate + "T12:00:00Z").toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", year: "numeric" },
                )}
                {data.closes[geo.tradeIdx] !== undefined && (
                  <>
                    {" "}
                    at{" "}
                    <span className="tabular-nums font-medium text-slate-700">
                      {fmtPrice(data.closes[geo.tradeIdx], data.currency)}
                    </span>
                  </>
                )}
              </span>
            </div>
          )}

          {/* Data attribution */}
          <p className="pl-14 pr-2 mt-2 text-[10px] text-slate-300">
            Price data via Yahoo Finance · Educational use only
          </p>
        </div>
      )}
    </div>
  );
}
