import { useSearchState } from "../../_states/search/search";

export const Home = () => {
  const state = useSearchState();
  return <div>{state.value}</div>;
};
