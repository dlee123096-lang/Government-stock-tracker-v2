// Congressional committee assignments — public record (congress.gov, senate.gov, house.gov)
// Ticker lists represent companies in sectors each committee directly oversees

export const COMMITTEE_SECTOR_MAP: Record<string, string[]> = {
  "Senate Armed Services": [
    "LMT", "RTX", "NOC", "GD", "BA", "BAH", "LDOS", "HII", "KTOS", "AXON",
  ],
  "House Armed Services": [
    "LMT", "RTX", "NOC", "GD", "BA", "BAH", "LDOS", "HII", "KTOS", "AXON",
  ],
  "Senate Finance": [
    "JPM", "GS", "MS", "BAC", "C", "WFC", "UNH", "CVS", "CI", "HUM",
  ],
  "House Ways and Means": [
    "JPM", "GS", "BAC", "UNH", "CVS", "CI", "HUM",
  ],
  "Senate Banking": [
    "JPM", "GS", "MS", "BAC", "C", "WFC", "V", "MA", "PYPL", "SQ", "COIN",
  ],
  "House Financial Services": [
    "JPM", "GS", "MS", "BAC", "C", "WFC", "V", "MA", "PYPL", "SQ", "COIN",
  ],
  "Senate Commerce": [
    "AAPL", "MSFT", "AMZN", "GOOGL", "META", "NFLX", "T", "VZ", "CMCSA", "DIS",
  ],
  "House Energy and Commerce": [
    "XOM", "CVX", "COP", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "UNH", "PFE", "JNJ",
  ],
  "Senate Energy and Natural Resources": [
    "XOM", "CVX", "COP", "SLB", "OXY", "NEE", "DUK", "SO",
  ],
  "House Natural Resources": [
    "XOM", "CVX", "COP", "SLB", "OXY", "FCX", "NEM",
  ],
  "Senate Intelligence": [
    "NVDA", "MSFT", "AMZN", "PLTR", "SAIC", "BAH", "LDOS", "CSCO", "PANW",
  ],
  "House Intelligence": [
    "NVDA", "MSFT", "AMZN", "PLTR", "SAIC", "BAH", "LDOS", "CSCO", "PANW",
  ],
  "Senate HELP": [
    "PFE", "MRNA", "JNJ", "ABBV", "BMY", "GILD", "UNH", "CVS", "CI", "HUM",
  ],
  "Senate Appropriations": [
    "LMT", "RTX", "NOC", "GD", "JPM", "GS", "BAC", "XOM", "CVX",
  ],
  "House Appropriations": [
    "LMT", "RTX", "NOC", "GD", "JPM", "GS", "BAC", "XOM", "CVX",
  ],
  "House Judiciary": [
    "GOOGL", "AMZN", "AAPL", "META", "MSFT",
  ],
};

export interface OfficialInfo {
  chamber: "Senate" | "House";
  state: string;
  committees: string[];
  title: string;
}

export const OFFICIALS: Record<string, OfficialInfo> = {
  // Senate
  "Tim Scott": {
    chamber: "Senate",
    state: "SC",
    committees: ["Senate Banking", "Senate Finance"],
    title: "U.S. Senator (SC)",
  },
  "Jack Reed": {
    chamber: "Senate",
    state: "RI",
    committees: ["Senate Armed Services", "Senate Appropriations"],
    title: "U.S. Senator (RI)",
  },
  "Roger Wicker": {
    chamber: "Senate",
    state: "MS",
    committees: ["Senate Armed Services", "Senate Commerce"],
    title: "U.S. Senator (MS)",
  },
  "Mark Warner": {
    chamber: "Senate",
    state: "VA",
    committees: ["Senate Intelligence", "Senate Banking", "Senate Finance"],
    title: "U.S. Senator (VA)",
  },
  "Marco Rubio": {
    chamber: "Senate",
    state: "FL",
    committees: ["Senate Intelligence", "Senate Commerce"],
    title: "U.S. Senator (FL)",
  },
  "James Lankford": {
    chamber: "Senate",
    state: "OK",
    committees: ["Senate Appropriations", "Senate Finance"],
    title: "U.S. Senator (OK)",
  },
  "Ron Wyden": {
    chamber: "Senate",
    state: "OR",
    committees: ["Senate Finance"],
    title: "U.S. Senator (OR)",
  },
  "Maria Cantwell": {
    chamber: "Senate",
    state: "WA",
    committees: ["Senate Commerce", "Senate Energy and Natural Resources"],
    title: "U.S. Senator (WA)",
  },
  "Ted Cruz": {
    chamber: "Senate",
    state: "TX",
    committees: ["Senate Commerce"],
    title: "U.S. Senator (TX)",
  },
  "Tommy Tuberville": {
    chamber: "Senate",
    state: "AL",
    committees: ["Senate Armed Services"],
    title: "U.S. Senator (AL)",
  },
  "Susan Collins": {
    chamber: "Senate",
    state: "ME",
    committees: ["Senate Appropriations"],
    title: "U.S. Senator (ME)",
  },
  "Shelley Moore Capito": {
    chamber: "Senate",
    state: "WV",
    committees: ["Senate Appropriations", "Senate Energy and Natural Resources"],
    title: "U.S. Senator (WV)",
  },
  "John Cornyn": {
    chamber: "Senate",
    state: "TX",
    committees: ["Senate Finance", "Senate Intelligence"],
    title: "U.S. Senator (TX)",
  },
  "Richard Blumenthal": {
    chamber: "Senate",
    state: "CT",
    committees: ["Senate Commerce"],
    title: "U.S. Senator (CT)",
  },
  "Kirsten Gillibrand": {
    chamber: "Senate",
    state: "NY",
    committees: ["Senate Armed Services"],
    title: "U.S. Senator (NY)",
  },
  "Patty Murray": {
    chamber: "Senate",
    state: "WA",
    committees: ["Senate Appropriations", "Senate HELP"],
    title: "U.S. Senator (WA)",
  },
  "Bernie Sanders": {
    chamber: "Senate",
    state: "VT",
    committees: ["Senate HELP"],
    title: "U.S. Senator (VT)",
  },
  "Thom Tillis": {
    chamber: "Senate",
    state: "NC",
    committees: ["Senate Banking", "Senate Armed Services"],
    title: "U.S. Senator (NC)",
  },
  // House
  "Nancy Pelosi": {
    chamber: "House",
    state: "CA",
    committees: ["House Armed Services"],
    title: "U.S. Representative (CA-11)",
  },
  "Adam Smith": {
    chamber: "House",
    state: "WA",
    committees: ["House Armed Services"],
    title: "U.S. Representative (WA-9)",
  },
  "Patrick McHenry": {
    chamber: "House",
    state: "NC",
    committees: ["House Financial Services"],
    title: "U.S. Representative (NC-10)",
  },
  "Maxine Waters": {
    chamber: "House",
    state: "CA",
    committees: ["House Financial Services"],
    title: "U.S. Representative (CA-43)",
  },
  "Anna Eshoo": {
    chamber: "House",
    state: "CA",
    committees: ["House Energy and Commerce"],
    title: "U.S. Representative (CA-16)",
  },
  "Michael Burgess": {
    chamber: "House",
    state: "TX",
    committees: ["House Energy and Commerce"],
    title: "U.S. Representative (TX-26)",
  },
  "Mike Quigley": {
    chamber: "House",
    state: "IL",
    committees: ["House Intelligence", "House Appropriations"],
    title: "U.S. Representative (IL-5)",
  },
  "Jim Himes": {
    chamber: "House",
    state: "CT",
    committees: ["House Intelligence", "House Financial Services"],
    title: "U.S. Representative (CT-4)",
  },
  "Dan Crenshaw": {
    chamber: "House",
    state: "TX",
    committees: ["House Intelligence", "House Energy and Commerce"],
    title: "U.S. Representative (TX-2)",
  },
  "Austin Scott": {
    chamber: "House",
    state: "GA",
    committees: ["House Armed Services"],
    title: "U.S. Representative (GA-8)",
  },
  "Virginia Foxx": {
    chamber: "House",
    state: "NC",
    committees: ["House Appropriations"],
    title: "U.S. Representative (NC-5)",
  },
};

export function getCommitteeRelevance(
  officialName: string,
  ticker: string,
): string[] {
  const tags: string[] = [];
  const info = OFFICIALS[officialName];
  if (!info) return tags;
  const hasRelevance = info.committees.some((committee) =>
    (COMMITTEE_SECTOR_MAP[committee] ?? []).includes(ticker.toUpperCase()),
  );
  if (hasRelevance) tags.push("Sector relevance to committee");
  return tags;
}

export function officialSubtype(
  officialName: string,
  ticker: string,
  tradeType: "Buy" | "Sell",
): string {
  if (tradeType === "Sell") return "Government official sell";
  const info = OFFICIALS[officialName];
  if (!info) return "Large congressional purchase";
  const isRelevant = info.committees.some((committee) =>
    (COMMITTEE_SECTOR_MAP[committee] ?? []).includes(ticker.toUpperCase()),
  );
  return isRelevant ? "Relevant committee trade" : "Large congressional purchase";
}
