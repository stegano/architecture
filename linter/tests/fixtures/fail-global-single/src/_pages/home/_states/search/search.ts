type SearchState = {
  query: string;
  results: [];
  status: "idle" | "ready" | "loading";
  error: string;
};

export const useSearchLandingState = () => ({
  formState: {
    query: "",
    results: [],
    status: "idle" as const,
    error: "",
  } as SearchState,
});
