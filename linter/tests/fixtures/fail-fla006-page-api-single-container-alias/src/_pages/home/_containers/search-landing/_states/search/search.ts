import { fetchSearchResults } from "@/_pages/home/_apis/search/search";

export const useSearchLandingState = () => ({
  results: fetchSearchResults(),
});
