import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
} from "react-hook-form";
import Modal, { type TModalVariant } from "../ui/modal";
import SimpleForm from "../ui/simpleform";
import { CgAdd, CgPen, CgTrash } from "react-icons/cg";
import { type PropsWithoutRef } from "react";
import { RoomReservation } from "@prisma/client";
import Confirmation from "@ui/confirmation";
import { useTranslation } from "next-i18next";
import { trpc } from "@trpcclient/trpc";

type RoomFormValues = {
  id?: string | undefined;
  name: string;
  reservation: RoomReservation;
  capacity: number;
  unavailable: boolean;
  openWithClub: boolean;
};

type CreateRoomProps = {
  siteId?: string;
  variant?: TModalVariant;
};

export const RESERVATIONS = [
  { value: RoomReservation.NONE, label: "no-reservation" },
  { value: RoomReservation.POSSIBLE, label: "reservation-possible" },
  { value: RoomReservation.MANDATORY, label: "reservation-mandatory" },
];

export const CreateRoom = ({
  siteId,
  variant = "Icon-Outlined-Primary",
}: CreateRoomProps) => {
  const utils = trpc.useContext();
  const createRoom = trpc.sites.createRoom.useMutation({
    onSuccess: () => {
      utils.sites.getRoomsForSite.invalidate(siteId);
      reset();
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
    <Modal
      title={t("new-room")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      buttonIcon={<CgAdd size={24} />}
      variant={variant}
    >
      <h3>{t("new-room")}</h3>
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
                value={getValues("reservation")}
                {...register("reservation")}
              >
                {RESERVATIONS.map((reservation) => (
                  <option key={reservation.value} value={reservation.value}>
                    {t(reservation.label)}
                  </option>
                ))}
              </select>
            ),
          },
        ]}
      />
    </Modal>
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
  variant = "Icon-Outlined-Secondary",
}: PropsUpdateDelete) => {
  const utils = trpc.useContext();
  const updateRoom = trpc.sites.updateRoom.useMutation({
    onSuccess: () => {
      utils.sites.getRoomsForSite.invalidate(siteId);
      reset();
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
    <Modal
      title={t("update-room")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      buttonIcon={<CgPen size={24} />}
      variant={variant}
    >
      <h3>{t("update-room")}</h3>
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
                value={getValues("reservation")}
                {...register("reservation")}
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
                    {...register("unavailable")}
                    defaultChecked={false}
                  />
                  <span className="label-text">{t("room-unavailable")}</span>
                </label>
              </div>
            ),
          },
        ]}
      />
    </Modal>
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
    },
  });

  return (
    <Confirmation
      message={t("room-deletion-message")}
      title={t("room-deletion")}
      buttonIcon={<CgTrash size={16} />}
      onConfirm={() => {
        deleteRoom.mutate(roomId);
      }}
      variant={variant}
    />
  );
};
