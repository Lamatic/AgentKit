import { readMarketSafe } from "@/lib/engine-client";
import { MarketConsole } from "@/components/market/MarketConsole";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const initialMarket = await readMarketSafe();

  return <MarketConsole initialMarket={initialMarket} />;
}
