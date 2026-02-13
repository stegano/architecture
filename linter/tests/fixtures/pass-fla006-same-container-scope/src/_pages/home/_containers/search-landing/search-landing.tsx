import { useSearchLandingState } from "./_states/search/search";
import { SearchLandingView } from "./_components/search-landing/search-landing";

export const SearchLandingContainer = () => {
  const { results } = useSearchLandingState();
  return <SearchLandingView results={results} />;
};
