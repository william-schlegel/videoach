import { intervalToDuration, startOfToday, format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { i18n } from "next-i18next";

/**
 * Convert a date to a compatible format fo date input
 * @param dt date to covert (default = now)
 * @returns date formated as YYYY-MM-DD
 */
export const formatDateAsYYYYMMDD = (dt: Date = startOfToday()) => {
  return format(dt, "yyyy-MM-dd");
};

/**
 * calculate nthe number of days from a certain date to now
 * @param startDate date to start calculation from
 * @returns nimber of days since the start date
 */
export const remainingDays = (startDate: Date) => {
  const days =
    intervalToDuration({ start: startDate, end: startOfToday() }).days ?? 0;
  return Math.max(days, 0);
};

export const formatDateLocalized = (
  dt: Date | null | undefined,
  withTime = false
) => {
  return format(dt ?? startOfToday(), withTime ? "Pp" : "P", {
    locale: i18n?.language === "en" ? enUS : fr,
  });
};
