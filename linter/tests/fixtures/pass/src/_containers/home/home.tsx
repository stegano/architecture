import { useHomeState } from "../../_states/home/home.ts";
import { HomeView } from "../../_components/home/home.tsx";

export const HomeContainer = () => {
  const state = useHomeState();
  return <HomeView title={state.title} />;
};
