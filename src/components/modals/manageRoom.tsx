import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
  type FieldValues,
  type FieldErrorsImpl,
  type UseFormRegister,
  type UseFormGetValues,
  type Path,
} from "react-hook-form";
import Modal, { type TModalVariant } from "../ui/modal";
import SimpleForm from "../ui/simpleform";
import { type PropsWithoutRef } from "react";
import { RoomReservation } from "@prisma/client";
import Confirmation from "@ui/confirmation";
import { useTranslation } from "next-i18next";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import { toast } from "react-toastify";

type RoomFormValues = {
  name: string;
  reservation: RoomReservation;
  capacity: number;
  unavailable: boolean;
};

type CreateRoomProps = {
  siteId?: string;
  variant?: TModalVariant;
};

export const RESERVATIONS = [
  { value: RoomReservation.NONE, label: "no-reservation" },
  { value: RoomReservation.POSSIBLE, label: "reservation-possible" },
  { value: RoomReservation.MANDATORY, label: "reservation-mandatory" },
] as const;

export const CreateRoom = ({
  siteId,
  variant = "Icon-Outlined-Primary",
}: CreateRoomProps) => {
  const utils = trpc.useContext();
  const createRoom = trpc.sites.createRoom.useMutation({
    onSuccess: () => {
      utils.sites.getRoomsForSite.invalidate(siteId);
      reset();
      toast.success(t("room-created") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<RoomFormValues>();
  const { t } = useTranslation("club");

  const onSubmit: SubmitHandler<RoomFormValues> = (data) => {
    console.log("data", data);
    if (siteId)
      createRoom.mutate({
        siteId,
        name: data.name,
        reservation: data.reservation,
        capacity: Number(data.capacity),
        unavailable: false,
        openWithClub: true,
      });
  };

  const onError: SubmitErrorHandler<RoomFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <>
      <Modal
        title={t("new-room")}
        handleSubmit={handleSubmit(onSubmit, onError)}
        buttonIcon={<i className="bx bx-plus bx-sm" />}
        variant={variant}
      >
        <h3>{t("new-room")}</h3>
        <RoomForm register={register} errors={errors} getValues={getValues} />
      </Modal>
    </>
  );
};

type PropsUpdateDelete = {
  siteId: string;
  roomId: string;
  variant?: TModalVariant;
};

export const UpdateRoom = ({
  siteId,
  roomId,
  variant = "Icon-Outlined-Primary",
}: PropsUpdateDelete) => {
  const utils = trpc.useContext();
  const queryRoom = trpc.sites.getRoomById.useQuery(roomId, {
    onSuccess(data) {
      if (data) reset(data);
    },
  });
  const updateRoom = trpc.sites.updateRoom.useMutation({
    onSuccess: () => {
      utils.sites.getRoomsForSite.invalidate(siteId);
      utils.sites.getRoomById.invalidate(roomId);
      reset();
      toast.success(t("room-updated") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<RoomFormValues>();
  const { t } = useTranslation("club");

  const onSubmit: SubmitHandler<RoomFormValues> = (data) => {
    console.log("data", data);
    if (siteId)
      updateRoom.mutate({
        id: roomId,
        ...data,
        capacity: Number(data.capacity),
      });
  };

  const onError: SubmitErrorHandler<RoomFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <>
      <Modal
        title={t("update-room")}
        handleSubmit={handleSubmit(onSubmit, onError)}
        buttonIcon={<i className="bx bx-edit bx-sm" />}
        variant={variant}
      >
        <h3>{t("update-room")}</h3>
        {queryRoom.isLoading ? (
          <Spinner />
        ) : (
          <RoomForm register={register} errors={errors} getValues={getValues} />
        )}
      </Modal>
    </>
  );
};

export const DeleteRoom = ({
  roomId,
  siteId,
  variant = "Icon-Outlined-Secondary",
}: PropsWithoutRef<PropsUpdateDelete>) => {
  const utils = trpc.useContext();
  const { t } = useTranslation("club");

  const deleteRoom = trpc.sites.deleteRoom.useMutation({
    onSuccess: () => {
      utils.sites.getRoomsForSite.invalidate(siteId);
      toast.success(t("room-deleted") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("room-deletion-message")}
      title={t("room-deletion")}
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      onConfirm={() => {
        deleteRoom.mutate(roomId);
      }}
      variant={variant}
    />
  );
};

type RoomFormProps<T extends FieldValues> = {
  errors?: FieldErrorsImpl;
  register: UseFormRegister<T>;
  getValues: UseFormGetValues<T>;
};

function RoomForm<T extends FieldValues>({
  errors,
  register,
  getValues,
}: RoomFormProps<T>): JSX.Element {
  const { t } = useTranslation("club");
  return (
    <SimpleForm
      errors={errors}
      register={register}
      fields={[
        {
          label: t("room-name"),
          name: "name",
          required: t("room-name-mandatory"),
        },
        {
          label: t("capacity"),
          name: "capacity",
          type: "number",
        },
        {
          name: "reservation",
          component: (
            <select
              className="select-bordered select w-full"
              defaultValue={getValues("reservation" as Path<T>)}
              {...register("reservation" as Path<T>)}
            >
              {RESERVATIONS.map((reservation) => (
                <option key={reservation.value} value={reservation.value}>
                  {t(reservation.label)}
                </option>
              ))}
            </select>
          ),
        },
        {
          name: "unavailable",
          component: (
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input
                  type="checkbox"
                  className="checkbox-primary checkbox"
                  {...register("unavailable" as Path<T>)}
                  defaultChecked={false}
                />
                <span className="label-text">{t("room-unavailable")}</span>
              </label>
            </div>
          ),
        },
      ]}
    />
  );
}
