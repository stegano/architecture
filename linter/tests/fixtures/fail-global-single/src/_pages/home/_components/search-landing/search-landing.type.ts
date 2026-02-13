export type SearchLandingViewProps = {
  query: string;
  results: Array<{ id: string }>;
  status: "idle" | "ready" | "loading";
  error: string;
  canSearch: boolean;
  isBusy: boolean;
  onSubmitQuery: () => Promise<void>;
  onChangeQuery: (query: string) => void;
};
