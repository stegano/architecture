import { useRouter } from "next/router";

export const useNavigationState = () => {
  const router = useRouter();
  
  return { path: router.pathname };
};
