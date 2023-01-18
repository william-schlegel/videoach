import { useDayName } from "@modals/manageCalendar";
import { type DayName } from "@prisma/client";

type SelectDayProps = {
  day: DayName;
  onNewDay: (newDay: DayName) => void;
};

export default function SelectDay({ day, onNewDay }: SelectDayProps) {
  const { getName, getNextDay, getPreviousDay } = useDayName();

  function handlePrev() {
    onNewDay(getPreviousDay(day));
  }

  function handleNext() {
    onNewDay(getNextDay(day));
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
