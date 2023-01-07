import dayjs from "dayjs";
import "dayjs/locale/fr";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(localizedFormat);

dayjs.locale("fr");

/**
 * Convert a date to a compatible format fo date input
 * @param dt date to covert (default = now)
 * @returns date formated as YYYY-MM-DD
 */
export const formatDateAsYYYYMMDD = (dt: Date = new Date(Date.now())) => {
  const y = dt.getFullYear();
  const m = dt.getMonth() + 1;
  const d = dt.getDate();

  return `${y}-${`0${m}`.slice(-2)}-${`0${d}`.slice(-2)}`;
};

/**
 * calculate nthe number of days from a certain date to now
 * @param startDate date to start calculation from
 * @returns nimber of days since the start date
 */
export const remainingDays = (startDate: Date) => {
  const days = dayjs(startDate).diff(undefined, "days");
  return Math.max(days, 0);
};

export const formatDateLocalized = (
  dt: Date | null = new Date(Date.now()),
  withTime = false
) => {
  return dayjs(dt).format(`L${withTime ? " LT" : ""}`);
};
