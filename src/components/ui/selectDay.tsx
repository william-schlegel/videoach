import { DAYS, useDayName } from "@modals/manageCalendar";
import { type DayName } from "@prisma/client";

type SelectDayProps = {
  day: DayName;
  onNewDay: (newDay: DayName) => void;
};

export default function SelectDay({ day, onNewDay }: SelectDayProps) {
  const { getName } = useDayName();

  function handlePrev() {
    let idx = DAYS.findIndex((d) => d.value === day);
    if (idx === 0) idx = DAYS.length - 1;
    else idx--;
    onNewDay(DAYS[idx]?.value ?? "MONDAY");
  }

  function handleNext() {
    let idx = DAYS.findIndex((d) => d.value === day);
    if (idx === DAYS.length - 1) idx = 0;
    else idx++;
    onNewDay(DAYS[idx]?.value ?? "MONDAY");
  }

  return (
    <div className="btn-group">
      <button className="btn btn-primary" onClick={handlePrev}>
        <i className="bx bx-chevron-left bx-sm" />
      </button>
      <span className="btn btn-primary w-32 text-center">{getName(day)}</span>
      <button className="btn btn-primary" onClick={handleNext}>
        <i className="bx bx-chevron-right bx-sm" />
      </button>
    </div>
  );
}
