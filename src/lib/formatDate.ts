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

type TformatDateLocalizedOptions = {
  withTime?: boolean;
  withDay?: boolean;
};

export const formatDateLocalized = (
  dt: Date | null | undefined,
  options?: TformatDateLocalizedOptions
) => {
  const { withTime, withDay } = options ?? { withTime: false, withDay: false };
  let frmt = "";
  if (withDay) frmt = "E ";
  frmt = frmt.concat("P");
  if (withTime) frmt = frmt.concat("p");
  return format(dt ?? startOfToday(), frmt, {
    locale: i18n?.language === "en" ? enUS : fr,
  });
};
