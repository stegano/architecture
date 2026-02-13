import { fetchHome } from "../../_apis/home/home.ts";

export const useHomeState = () => {
  return {
    title: fetchHome(),
  };
};
