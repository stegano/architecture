const templateNoise = `
  import { Home } from '../../_pages/home/home';
  export { default as HomeDefault } from '../../_pages/home/home';
  require('../../_pages/home/home');
`;
const textNoise = "import { Home } from '../../_pages/home/home';";
import { fetchHome } from "../../_apis/widget/widget";
import { Home } from "../../_pages/home/home";

export { SearchLandingView } from "./search-landing";

export const Widget = () => <div>{fetchHome?.name || textNoise.length}</div>;
