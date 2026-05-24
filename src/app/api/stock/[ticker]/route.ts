import { NextRequest, NextResponse } from "next/server";

// Maps UI range labels to Yahoo Finance API parameters
const RANGE_CONFIG: Record<string, { interval: string }> = {
  "1d":  { interval: "2m"  },
  "5d":  { interval: "15m" },
  "1mo": { interval: "1d"  },
  "6mo": { interval: "1d"  },
  "ytd": { interval: "1d"  },
  "1y":  { interval: "1d"  },
  "5y":  { interval: "1wk" },
  "max": { interval: "1mo" },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } },
) {
  const ticker = params.ticker.toUpperCase();
  const range = request.nextUrl.searchParams.get("range") ?? "1y";
  const interval = RANGE_CONFIG[range]?.interval ?? "1d";

  const url = new URL(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`,
  );
  url.searchParams.set("interval", interval);
  url.searchParams.set("range", range);
  url.searchParams.set("includePrePost", "false");
  url.searchParams.set("events", "div,splits");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json",
        "Accept-Language": "en-US,en;q=0.9",
      },
      // Cache each ticker+range combo for 5 minutes on the server
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Upstream data unavailable" },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch price data" },
      { status: 502 },
    );
  }
}
