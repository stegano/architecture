import { usePathname } from "next/navigation";

export const getCurrentPath = () => {
  const pathname = usePathname();
  
  return pathname;
};
