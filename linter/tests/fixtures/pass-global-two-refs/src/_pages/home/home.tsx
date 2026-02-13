import { SearchLandingContainer } from "./_containers/search-landing/search-landing";
import { SearchSummaryContainer } from "./_containers/search-summary/search-summary";

export const Home = () => {
  return (
    <main>
      <SearchLandingContainer />
      <SearchSummaryContainer />
    </main>
  );
};
