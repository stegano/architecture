import{useParams}from"react-router-dom";

export const CompactImport = () => {
  const params = useParams();
  return <div>{params.id}</div>;
};
