import { type PropsWithoutRef } from "react";
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

const DAYS = [
  { value: DayName.MONDAY, label: "monday" },
  { value: DayName.TUESDAY, label: "tuesday" },
  { value: DayName.WEDNESDAY, label: "wednesday" },
  { value: DayName.THURSDAY, label: "thursday" },
  { value: DayName.FRIDAY, label: "friday" },
  { value: DayName.SATURDAY, label: "saturday" },
  { value: DayName.SUNDAY, label: "sunday" },
];

const formSchema = z.object({
  startDate: z.date().or(z.string()),
  time: z.array(
    z.object({
      dayName: z.nativeEnum(DayName),
      start: z.array(z.date()),
      end: z.array(z.date()),
    })
  ),
});

type TimeFormValues = z.infer<typeof formSchema>;

export const CreateCalendar = () => {
  // const { data: sessionData } = useSession();
  // const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TimeFormValues>({
    resolver: zodResolver(formSchema),
  });
  const { t } = useTranslation("calendar");

  // const createClub = trpc.clubs.createClub.useMutation({
  //   onSuccess: () => {
  //     utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
  //   },
  // });

  const onSubmit: SubmitHandler<TimeFormValues> = (data) => {
    console.log("data", data);
    // createClub.mutate({ userId: sessionData?.user?.id ?? "", ...data });
  };

  const onError: SubmitErrorHandler<TimeFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("create-new-calendar")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText="Enregistrer"
      errors={errors}
      buttonIcon={<CgTime size={24} />}
      onOpenModal={() => reset()}
    >
      <h3>{t("create-new-calendar")}</h3>
      <form>
        <div className="form-control mb-2 w-full max-w-xs">
          <label>{t("start-date")}</label>
          <input
            type="date"
            {...register("startDate", { valueAsDate: true })}
            className="text-center"
          />
        </div>
        <div className="grid grid-cols-[min-content,_auto,_2rem] items-center gap-x-2 gap-y-1">
          {DAYS.map((day, idx) => (
            <>
              <span>{t(day.label)}</span>
              <div className="flex gap-2">
                <input
                  type="time"
                  {...register(`time.${idx}.start.0`, { valueAsDate: true })}
                  className="input-sm w-fit text-center"
                />
                <input
                  type="time"
                  {...register(`time.${idx}.end.0`, { valueAsDate: true })}
                  className="input-sm w-fit text-center"
                />
              </div>
              <CgAdd size={16} className="text-center text-secondary" />
            </>
          ))}
        </div>
      </form>
    </Modal>
  );
};

type PropsUpdateDelete = {
  calendarId: string;
};

export const UpdateCalendar = ({
  calendarId,
}: PropsWithoutRef<PropsUpdateDelete>) => {
  const { data: sessionData } = useSession();
  const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<TimeFormValues>();
  const { t } = useTranslation("club");
  // const queryClub = trpc.clubs.getClubById.useQuery(clubId, {
  //   onSuccess(data) {
  //     reset({
  //       address: data?.address,
  //       name: data?.name,
  //     });
  //   },
  // });
  // const updateClub = trpc.clubs.updateClub.useMutation({
  //   onSuccess: () => {
  //     utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
  //     utils.clubs.getClubById.invalidate(clubId);
  //   },
  // });

  const onSubmit: SubmitHandler<TimeFormValues> = (data) => {
    console.log("data :>> ", data);
    // updateClub.mutate({ id: clubId, ...data });
  };

  const onError: SubmitErrorHandler<TimeFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("update-calendar")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText="Enregistrer"
      errors={errors}
      buttonIcon={<CgPen size={24} />}
      variant={ModalVariant.ICON_OUTLINED_PRIMARY}
    >
      {/* <SimpleForm
        errors={errors}
        register={register}
        isLoading={queryClub.isLoading}
        fields={[
          {
            label: t("club-name"),
            name: "name",
            required: t("name-mandatory"),
          },
          {
            label: t("club-address"),
            name: "address",
            required: t("address-mandatory"),
          },
        ]}
      /> */}
    </Modal>
  );
};

export const DeleteClub = ({
  calendarId,
}: PropsWithoutRef<PropsUpdateDelete>) => {
  const utils = trpc.useContext();
  const { data: sessionData } = useSession();
  const { t } = useTranslation("club");

  // const deleteClub = trpc.clubs.deleteClub.useMutation({
  //   onSuccess: () => {
  //     utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
  //     utils.clubs.getClubById.invalidate(clubId);
  //   },
  // });

  return (
    <Confirmation
      message={t("club-deletion-message")}
      title={t("club-deletion")}
      onConfirm={() => {
        //deleteClub.mutate(clubId);
        console.log("delete calendar :>> ", calendarId);
      }}
      buttonIcon={<CgTrash size={24} />}
      variant={ModalVariant.ICON_OUTLINED_SECONDARY}
    />
  );
};

export default CreateCalendar;
