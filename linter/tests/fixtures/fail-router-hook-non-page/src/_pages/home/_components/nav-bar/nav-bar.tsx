import * as navigation from "next/navigation";

export const NavBar = () => {
  const pathname = navigation.usePathname();

  return <nav>{pathname}</nav>;
};
