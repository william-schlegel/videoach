import { Fragment, useState, type PropsWithoutRef } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "../../utils/trpc";
import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
} from "react-hook-form";
import Modal, { ModalVariant } from "../ui/modal";
import { CgAdd, CgPen, CgTime, CgTrash } from "react-icons/cg";
import Confirmation from "../ui/confirmation";
import { useTranslation } from "next-i18next";
import { DayName } from "@prisma/client";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import SimpleForm from "@ui/simpleform";

export const DAYS = [
  { value: DayName.MONDAY, label: "monday" },
  { value: DayName.TUESDAY, label: "tuesday" },
  { value: DayName.WEDNESDAY, label: "wednesday" },
  { value: DayName.THURSDAY, label: "thursday" },
  { value: DayName.FRIDAY, label: "friday" },
  { value: DayName.SATURDAY, label: "saturday" },
  { value: DayName.SUNDAY, label: "sunday" },
];

const calendarFormSchema = z.object({
  startDate: z.date(),
  openingTime: z.array(
    z.object({
      name: z.nativeEnum(DayName),
      wholeDay: z.boolean(),
      start: z.array(z.string()).optional(),
      end: z.array(z.string()).optional(),
    })
  ),
});

type CalendarFormValues = z.infer<typeof calendarFormSchema>;

const calendarDefaultValues: CalendarFormValues = {
  startDate: new Date(),
  openingTime: DAYS.map((day) => ({
    name: day.value,
    wholeDay: true,
    start: ["00:00"],
    end: ["23:59"],
  })),
};

const FormCalendar = () => {
  // const { data: sessionData } = useSession();
  // const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CalendarFormValues>({
    resolver: zodResolver(calendarFormSchema),
    defaultValues: calendarDefaultValues,
    mode: "onChange",
  });
  const wholeDays = watch([
    "openingTime.0.wholeDay",
    "openingTime.1.wholeDay",
    "openingTime.2.wholeDay",
    "openingTime.3.wholeDay",
    "openingTime.4.wholeDay",
    "openingTime.5.wholeDay",
    "openingTime.6.wholeDay",
  ]);
  const { t } = useTranslation("calendar");

  // const createClub = trpc.clubs.createClub.useMutation({
  //   onSuccess: () => {
  //     utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
  //   },
  // });

  const onSubmit: SubmitHandler<CalendarFormValues> = (data) => {
    console.log("data", data);
    // createClub.mutate({ userId: sessionData?.user?.id ?? "", ...data });
  };

  const onError: SubmitErrorHandler<CalendarFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onError)}>
      <div className="form-control mb-2 w-full max-w-xs">
        <label>{t("start-date")}</label>
        <input
          type="date"
          {...register("startDate", { valueAsDate: true })}
          className="text-center"
        />
      </div>
      <div className="grid grid-cols-[min-content,_min-content,_auto,_2rem] items-center gap-x-2 gap-y-1">
        {DAYS.map((day, idx) => (
          <Fragment key={day.value}>
            <span>{t(day.label)}</span>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="checkbox-primary checkbox"
                  {...register(`openingTime.${idx}.wholeDay`)}
                  defaultChecked={true}
                />
                <span className="label-text">{t("whole-day")}</span>
              </label>
            </div>
            {wholeDays[idx] ? (
              <>
                <span></span>
                <span></span>
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    type="time"
                    {...register(`openingTime.${idx}.start.0`)}
                    className="input-sm w-fit text-center"
                  />
                  <input
                    type="time"
                    {...register(`openingTime.${idx}.end.0`)}
                    className="input-sm w-fit text-center"
                  />
                </div>
                <CgAdd size={16} className="text-center text-secondary" />
              </>
            )}
          </Fragment>
        ))}
      </div>
    </form>
  );
};

type SiteCalendarProps = {
  siteId: string;
};

export const CreateSiteCalendar = ({ siteId }: SiteCalendarProps) => {
  console.log("siteId", siteId);
  const { t } = useTranslation("calendar");
  const [showCalendar, setShowCalendar] = useState(false);
  function onSubmit() {
    console.log("submit");
  }

  return (
    <Modal
      title={t("create-site-calendar")}
      handleSubmit={onSubmit}
      submitButtonText={t("save-calendar")}
      buttonIcon={<CgTime size={16} />}
      variant={ModalVariant.ICON_OUTLINED_SECONDARY}
    >
      <h3>{t("create-site-calendar")}</h3>
      <div className="form-control">
        <label className="label cursor-pointer justify-start gap-4">
          <input
            type="checkbox"
            className="checkbox-primary checkbox"
            defaultChecked={true}
            onChange={(e) => setShowCalendar(!e.target.checked)}
          />
          <span className="label-text">{t("same-as-club")}</span>
        </label>
      </div>
      {showCalendar ? <FormCalendar /> : null}
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
