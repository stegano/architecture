import { formatDate } from "../../_utils/date/date.ts";

export const fetchHome = () => {
  return formatDate(new Date("2026-01-01"));
};
