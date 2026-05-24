export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-xs text-gray-500 leading-relaxed">
          <p className="font-semibold text-gray-700 mb-2">
            Educational Disclaimer
          </p>
          <p>
            This website is for educational and research purposes only. It does
            not provide financial advice, investment recommendations, or
            buy/sell signals. Public disclosures may be delayed, incomplete, or
            inaccurate. Always do your own research or consult a licensed
            financial advisor before making investment decisions.
          </p>
          <p className="mt-3 text-gray-400">
            Signal Alpha Stock — Data sourced from public SEC EDGAR and STOCK Act disclosures. Not affiliated with any government agency.
          </p>
        </div>
      </div>
    </footer>
  );
}
