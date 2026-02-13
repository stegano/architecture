import { fetchSearchResults } from "../../../../_apis/search/search";

export const useSearchLandingState = () => ({
  results: fetchSearchResults(),
});
