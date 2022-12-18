import { useEffect } from "react";
import { useState } from "react";
// import { useSession } from "next-auth/react";
import { trpc } from "../../utils/trpc";
import Modal from "../ui/modal";
import { CgAdd, CgTime } from "react-icons/cg";
// import Confirmation from "../ui/confirmation";
import { useTranslation } from "next-i18next";
import { DayName } from "@prisma/client";
import ButtonIcon from "@ui/buttonIcon";
import { fieldSet } from "@lib/fieldGetSet";
import { formatDateAsYYYYMMDD } from "@lib/formatDate";

export const DAYS = [
  { value: DayName.MONDAY, label: "monday" },
  { value: DayName.TUESDAY, label: "tuesday" },
  { value: DayName.WEDNESDAY, label: "wednesday" },
  { value: DayName.THURSDAY, label: "thursday" },
  { value: DayName.FRIDAY, label: "friday" },
  { value: DayName.SATURDAY, label: "saturday" },
  { value: DayName.SUNDAY, label: "sunday" },
] as const;

type WorkingHoursSchema = {
  opening: string;
  closing: string;
};

type OpeningTimeSchema = {
  name: DayName;
  wholeDay: boolean;
  closed: boolean;
  workingHours: WorkingHoursSchema[];
};
type CalendarFormSchema = {
  startDate: Date;
  openingTime: OpeningTimeSchema[];
};

function useFormCalendar(initialCalendar?: CalendarFormSchema) {
  const calendarDefaultValues: CalendarFormSchema = {
    startDate: new Date(),
    openingTime: DAYS.map((day) => ({
      name: day.value,
      wholeDay: true,
      closed: false,
      workingHours: [
        {
          opening: "00:00",
          closing: "23:59",
        },
      ],
    })),
  };
  const [calendar, setCalendar] = useState(calendarDefaultValues);
  useEffect(() => {
    if (initialCalendar) setCalendar(initialCalendar);
  }, [initialCalendar]);

  function updateCalendar(cal: CalendarFormSchema) {
    setCalendar(cal);
  }

  return { calendar, updateCalendar };
}

type FormCalendarProps = {
  calendarValues: CalendarFormSchema;
  onCalendarChange: (cal: CalendarFormSchema) => void;
};

function FormCalendar({ calendarValues, onCalendarChange }: FormCalendarProps) {
  const { t } = useTranslation("calendar");

  const onChange = (path: string, value: unknown) => {
    const cv = { ...calendarValues };
    fieldSet(cv, path, value);
    onCalendarChange(cv);
  };

  return (
    <>
      <div className="mb-2 grid grid-cols-[max-content,_1fr] gap-4">
        <label>{t("start-date")}</label>
        <input
          type="date"
          value={formatDateAsYYYYMMDD(calendarValues.startDate)}
          onChange={(e) => onChange("startDate", new Date(e.target.value))}
          className="text-center"
        />
      </div>
      <table className="w-full table-auto">
        {/* header */}
        <thead>
          <tr>
            <th>{t("day")}</th>
            <th>{t("whole-day")}</th>
            <th>{t("closed")}</th>
            <th>{t("times")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day, idx) => (
            <tr key={day.value}>
              <td>{t(day.label)}</td>
              <td className="text-center">
                <input
                  type="checkbox"
                  className="checkbox-primary checkbox"
                  checked={calendarValues.openingTime[idx]?.wholeDay ?? true}
                  onChange={(e) =>
                    onChange(`openingTime.${idx}.wholeDay`, e.target.checked)
                  }
                />
              </td>
              {!calendarValues.openingTime[idx]?.wholeDay ? (
                <>
                  <td className="text-center">
                    <input
                      type="checkbox"
                      className="checkbox-primary checkbox"
                      checked={calendarValues.openingTime[idx]?.closed ?? false}
                      onChange={(e) =>
                        onChange(`openingTime.${idx}.closed`, e.target.checked)
                      }
                    />
                  </td>

                  {!calendarValues.openingTime[idx]?.closed ? (
                    <>
                      <td className="flex gap-2">
                        <input
                          type="time"
                          value={
                            calendarValues.openingTime[idx]?.workingHours?.[0]
                              ?.opening
                          }
                          onChange={(e) =>
                            onChange(
                              `openingTime.${idx}.workingHours.0.opening`,
                              e.target.value
                            )
                          }
                          className="input-sm w-fit text-center"
                        />
                        <input
                          type="time"
                          value={
                            calendarValues.openingTime[idx]?.workingHours?.[0]
                              ?.closing
                          }
                          onChange={(e) =>
                            onChange(
                              `openingTime.${idx}.workingHours.0.closing`,
                              e.target.value
                            )
                          }
                          className="input-sm w-fit text-center"
                        />
                      </td>
                      <td>
                        <ButtonIcon
                          title={t("more-times")}
                          iconComponent={<CgAdd />}
                          buttonVariant="Icon-Outlined-Secondary"
                          buttonSize="btn-sm"
                        />
                      </td>
                    </>
                  ) : null}
                </>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

type ClubCalendarProps = {
  clubId: string;
};

export const CreateClubCalendar = ({ clubId }: ClubCalendarProps) => {
  const { t } = useTranslation("calendar");
  const { calendar, updateCalendar } = useFormCalendar();
  const saveCalendar = trpc.calendars.createCalendar.useMutation();
  const updateClub = trpc.clubs.updateClubCalendar.useMutation();

  function onSubmit() {
    saveCalendar.mutate(calendar, {
      onSuccess(data) {
        if (data.id)
          updateClub.mutate({
            id: clubId,
            calendarId: data.id,
          });
      },
    });
  }

  return (
    <Modal
      title={t("create-club-calendar")}
      handleSubmit={onSubmit}
      submitButtonText={t("save-calendar")}
      buttonIcon={<CgTime size={16} />}
      variant="Icon-Outlined-Secondary"
      className="w-2/3 max-w-xl"
    >
      <h3>{t("create-club-calendar")}</h3>
      <FormCalendar
        calendarValues={calendar}
        onCalendarChange={updateCalendar}
      />
    </Modal>
  );
};

type SiteCalendarProps = {
  siteId: string;
};

export const CreateSiteCalendar = ({ siteId }: SiteCalendarProps) => {
  const { t } = useTranslation("calendar");
  const [showCalendar, setShowCalendar] = useState(false);
  const { calendar, updateCalendar } = useFormCalendar();
  const saveCalendar = trpc.calendars.createCalendar.useMutation();
  const updateSite = trpc.sites.updateSiteCalendar.useMutation();

  function onSubmit() {
    saveCalendar.mutate(calendar, {
      onSuccess(data) {
        if (data.id)
          updateSite.mutate({
            id: siteId,
            calendarId: data.id,
          });
      },
    });
  }

  return (
    <Modal
      title={t("create-site-calendar")}
      handleSubmit={onSubmit}
      submitButtonText={t("save-calendar")}
      buttonIcon={<CgTime size={16} />}
      variant="Icon-Outlined-Secondary"
      className="w-2/3 max-w-xl"
    >
      <h3>{t("create-site-calendar")}</h3>
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-4">
          <input
            type="checkbox"
            className="checkbox-primary checkbox"
            checked={!showCalendar}
            onChange={(e) => setShowCalendar(!e.target.checked)}
          />
          <span className="label-text">{t("same-as-club")}</span>
        </label>
      </div>
      {showCalendar ? (
        <FormCalendar
          calendarValues={calendar}
          onCalendarChange={updateCalendar}
        />
      ) : null}
    </Modal>
  );
};

// type PropsUpdateDelete = {
//   calendarId: string;
// };

// export const UpdateCalendar = ({
//   calendarId,
// }: PropsWithoutRef<PropsUpdateDelete>) => {
//   const { data: sessionData } = useSession();
//   const utils = trpc.useContext();
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     reset,
//   } = useForm<TimeFormValues>();
//   const { t } = useTranslation("club");
//   // const queryClub = trpc.clubs.getClubById.useQuery(clubId, {
//   //   onSuccess(data) {
//   //     reset({
//   //       address: data?.address,
//   //       name: data?.name,
//   //     });
//   //   },
//   // });
//   // const updateClub = trpc.clubs.updateClub.useMutation({
//   //   onSuccess: () => {
//   //     utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
//   //     utils.clubs.getClubById.invalidate(clubId);
//   //   },
//   // });

//   const onSubmit: SubmitHandler<TimeFormValues> = (data) => {
//     console.log("data :>> ", data);
//     // updateClub.mutate({ id: clubId, ...data });
//   };

//   const onError: SubmitErrorHandler<TimeFormValues> = (errors) => {
//     console.log("errors", errors);
//   };

//   return (
//     <Modal
//       title={t("update-calendar")}
//       handleSubmit={handleSubmit(onSubmit, onError)}
//       submitButtonText="Enregistrer"
//       errors={errors}
//       buttonIcon={<CgPen size={24} />}
//       variant={ModalVariant.ICON_OUTLINED_PRIMARY}
//     >
//       {/* <SimpleForm
//         errors={errors}
//         register={register}
//         isLoading={queryClub.isLoading}
//         fields={[
//           {
//             label: t("club-name"),
//             name: "name",
//             required: t("name-mandatory"),
//           },
//           {
//             label: t("club-address"),
//             name: "address",
//             required: t("address-mandatory"),
//           },
//         ]}
//       /> */}
//     </Modal>
//   );
// };

// export const DeleteClub = ({
//   calendarId,
// }: PropsWithoutRef<PropsUpdateDelete>) => {
//   const utils = trpc.useContext();
//   const { data: sessionData } = useSession();
//   const { t } = useTranslation("club");

//   // const deleteClub = trpc.clubs.deleteClub.useMutation({
//   //   onSuccess: () => {
//   //     utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
//   //     utils.clubs.getClubById.invalidate(clubId);
//   //   },
//   // });

//   return (
//     <Confirmation
//       message={t("club-deletion-message")}
//       title={t("club-deletion")}
//       onConfirm={() => {
//         //deleteClub.mutate(clubId);
//         console.log("delete calendar :>> ", calendarId);
//       }}
//       buttonIcon={<CgTrash size={24} />}
//       variant={ModalVariant.ICON_OUTLINED_SECONDARY}
//     />
//   );
// };

// export default CreateCalendar;
