import { useParams } from "react-router-dom";

export const Home = () => {
  const params = useParams();

  return <div>{JSON.stringify(params)}</div>;
};
