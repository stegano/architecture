import type { SearchLandingViewProps } from "./search-landing.type";

export const SearchLandingView = ({ results }: SearchLandingViewProps) => {
  return <div>{results.length}</div>;
};
