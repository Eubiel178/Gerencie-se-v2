import { HistoryPage } from "@/features/history";
import { getHistoryFetcher } from "@/features/history/data/local-history";

export default async function HistoryRoutePage() {
  const fetcher = getHistoryFetcher();
  const initialEntries = await fetcher.loadEntries({ period: "30d", type: "all" });

  return (
    <HistoryPage
      initialEntries={initialEntries}
      initialPeriod="30d"
      initialType="all"
    />
  );
}
