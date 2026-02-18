import { useSearchParams } from "next/navigation";

export const fetchUserFromQuery = () => {
  const params = useSearchParams();
  
  return fetch(`/api/user?id=${params.get("id")}`);
};
