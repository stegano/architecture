import * as router from "next/navigation";

export const UserContainer = () => {
  const params = router.useParams();

  return <div>{params.id}</div>;
};
