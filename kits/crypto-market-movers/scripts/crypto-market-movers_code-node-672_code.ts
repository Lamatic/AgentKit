// Code Node: Rank Market Movers
//
// Ranking is deterministic (not LLM-driven) so results are reproducible,
// testable, and free of numerical hallucination risk. Coins are sorted on
// raw, unrounded values; rounding is applied only after the top 5 gainers
// and losers are selected, so display formatting never affects ranking order.

const rawCoins = {{apiNode_407.output}};

// CoinGecko can return a non-array payload (e.g. an error object during
// rate limiting or an outage), so validate before processing.
const coinList = Array.isArray(rawCoins) ? rawCoins : [];

const validCoins = coinList
  .filter(
    coin =>
      coin &&
      coin.name &&
      coin.symbol &&
      Number.isFinite(Number(coin.current_price)) &&
      Number.isFinite(Number(coin.price_change_percentage_24h)) &&
      Number.isFinite(Number(coin.total_volume))
  )
  .map(coin => ({
    name: coin.name,
    symbol: String(coin.symbol).toUpperCase(),
    current_price: Number(coin.current_price),
    price_change_percentage_24h: Number(coin.price_change_percentage_24h),
    market_cap_rank: coin.market_cap_rank,
    total_volume: Number(coin.total_volume)
  }));

// Sub-$1 coins keep more decimal places so small values stay meaningful.
function roundPrice(price) {
  return Math.abs(price) < 1
    ? Number(price.toFixed(6))
    : Number(price.toFixed(2));
}

function formatRankedCoin(coin) {
  return {
    name: coin.name,
    symbol: coin.symbol,
    current_price: roundPrice(coin.current_price),
    price_change_percentage_24h: Number(
      coin.price_change_percentage_24h.toFixed(2)
    ),
    market_cap_rank: coin.market_cap_rank,
    total_volume: Math.round(coin.total_volume)
  };
}

const topGainers = [...validCoins]
  .sort(
    (a, b) =>
      b.price_change_percentage_24h - a.price_change_percentage_24h
  )
  .slice(0, 5)
  .map(formatRankedCoin);

const topLosers = [...validCoins]
  .sort(
    (a, b) =>
      a.price_change_percentage_24h - b.price_change_percentage_24h
  )
  .slice(0, 5)
  .map(formatRankedCoin);

return {
  analyzed_coin_count: validCoins.length,
  top_gainers: topGainers,
  top_losers: topLosers
};
