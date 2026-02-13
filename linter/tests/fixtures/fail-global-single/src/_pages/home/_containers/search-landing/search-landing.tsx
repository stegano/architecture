import { useSearchLandingState } from "../../_states/search/search";
import { SearchLandingView } from "../../_components/search-landing/search-landing";

export const SearchLandingContainer = () => {
  const { formState } = useSearchLandingState();

  return (
    <SearchLandingView
      query={formState.query}
      results={formState.results}
      status={formState.status}
      error={formState.error}
      canSearch={formState.query.length >= 2}
      isBusy={false}
      onSubmitQuery={async () => Promise.resolve()}
      onChangeQuery={() => {}}
    />
  );
};
