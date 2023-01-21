import { useDayName } from "@lib/useDayName";
import { type DayName } from "@prisma/client";

type SelectDayProps = {
  day: DayName;
  onNewDay: (newDay: DayName) => void;
};

export default function SelectDay({ day, onNewDay }: SelectDayProps) {
  const { getName, getNextDay, getPreviousDay, getToday } = useDayName();

  return (
    <div className="btn-group">
      <button
        className="btn btn-primary"
        onClick={() => onNewDay(getPreviousDay(day))}
      >
        <i className="bx bx-chevron-left bx-sm" />
      </button>
      <span className="btn btn-primary w-32 text-center">{getName(day)}</span>
      <button className="btn btn-primary" onClick={() => onNewDay(getToday())}>
        <i className="bx bx-calendar-event bx-sm" />
      </button>
      <button
        className="btn btn-primary"
        onClick={() => onNewDay(getNextDay(day))}
      >
        <i className="bx bx-chevron-right bx-sm" />
      </button>
    </div>
  );
}
