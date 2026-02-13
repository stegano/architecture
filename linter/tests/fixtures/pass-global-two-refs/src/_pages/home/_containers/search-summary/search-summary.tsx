import { useSearchLandingState } from "../../_states/search/search";

export const SearchSummaryContainer = () => {
  const { query } = useSearchLandingState();
  return <section>{query}</section>;
};
