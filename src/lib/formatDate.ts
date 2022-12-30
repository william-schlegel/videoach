import dayjs from "dayjs";

dayjs.locale("fr-fr");

export const formatDateAsYYYYMMDD = (dt: Date) => {
  const y = dt.getFullYear();
  const m = dt.getMonth() + 1;
  const d = dt.getDate();

  return `${y}-${`0${m}`.slice(-2)}-${`0${d}`.slice(-2)}`;
};

export const remainingDays = (startDate: Date) => {
  const days = dayjs(startDate).diff(undefined, "days");
  return Math.max(days, 0);
};
