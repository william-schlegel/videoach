import useDebounce from "@lib/useDebounce";
import { trpc } from "@trpcclient/trpc";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";

type Props = {
  label?: string;
  initialActivity?: string;
  className?: string;
  onSearch: (activity: ActivityData) => void;
  onActivityChange: (value: string) => void;
  required?: boolean;
  iconActivity?: boolean;
  error?: string;
};

type ActivityData = {
  id: string;
  name: string;
};

const ActivitySearch = ({
  initialActivity,
  label,
  onSearch,
  className,
  required,
  iconActivity = true,
  error,
  onActivityChange,
}: Props) => {
  const [activity, setActivity] = useState("");
  const debouncedActivity = useDebounce<string>(activity, 500);
  const { t } = useTranslation("common");
  const [showList, setShowList] = useState(false);

  const activities = trpc.coachs.getOfferActivityByName.useQuery(
    debouncedActivity,
    { enabled: debouncedActivity !== "" }
  );

  useEffect(() => {
    onActivityChange(debouncedActivity);
    setShowList(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedActivity]);

  useEffect(() => {
    if (initialActivity) setActivity(initialActivity);
  }, [initialActivity]);

  return (
    <>
      {label ? (
        <label className={`label ${required ? "required" : ""}`}>{label}</label>
      ) : null}
      <div className={`dropdown dropdown-bottom ${className ?? ""}`}>
        <div className="input-group">
          {iconActivity ? (
            <span>
              <i className="bx bx-search bx-md text-primary" />
            </span>
          ) : null}
          <input
            className="input-bordered input w-full"
            value={debouncedActivity}
            onChange={(e) => setActivity(e.currentTarget.value)}
            list="activities"
            placeholder={t("enter-activity")}
          />
        </div>
        {error ? <p className="label-text-alt text-error">{error}</p> : null}
        {showList && activities.data?.length ? (
          <ul className="dropdown-content menu rounded-box w-full bg-base-100 p-2 shadow">
            {activities.data?.map((activity) => (
              <li key={activity.id}>
                <button
                  type="button"
                  onClick={() => {
                    setActivity(activity.name);
                    onSearch({ id: activity.id, name: activity.name });
                    setShowList(false);
                  }}
                >
                  {activity.name}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </>
  );
};

export default ActivitySearch;
