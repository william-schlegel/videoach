export const formatDateAsYYYYMMDD = (dt: Date) => {
  const y = dt.getFullYear();
  const m = dt.getMonth();
  const d = dt.getDate();

  return `${y}-${`0${m}`.slice(-2)}-${`0${d}`.slice(-2)}`;
};
