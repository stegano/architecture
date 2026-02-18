import { useParams } from "react-router-dom";

export const UserProfile = () => {
  const params = useParams();

  return <div>{params.id}</div>;
};
