interface BadPayload {
  id: string;
}

export const useBad = (): BadPayload => ({
  id: "x",
});
