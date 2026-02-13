import { useSearchLandingState } from "../../_states/search/search";

export const SearchLandingContainer = () => {
  const { query } = useSearchLandingState();
  return <div>{query}</div>;
};
