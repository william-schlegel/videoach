import { trpc } from "../../utils/trpc";
import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
  type FieldErrorsImpl,
  type UseFormRegister,
  type FieldValues,
} from "react-hook-form";
import Modal, { ModalVariant } from "../ui/modal";
import SimpleForm from "../ui/simpleform";
import { CgAdd, CgPen, CgTrash } from "react-icons/cg";
import {
  type Dispatch,
  type SetStateAction,
  useState,
  type PropsWithoutRef,
} from "react";
import { RoomReservation } from "@prisma/client";
import { useSession } from "next-auth/react";
import Confirmation from "@ui/confirmation";
import { useTranslation } from "next-i18next";

type SiteFormValues = {
  name: string;
  address: string;
};

type RoomFormValues = {
  id?: string | undefined;
  name: string;
  reservation: RoomReservation;
  capacity: number;
  unavailable: boolean;
  openWithClub: boolean;
};

type CreateSiteProps = {
  clubId: string;
};

export const CreateSite = ({ clubId }: CreateSiteProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SiteFormValues>();
  const [rooms, setRooms] = useState<RoomFormValues[]>([]);
  const utils = trpc.useContext();
  const { t } = useTranslation("club");

  const createSite = trpc.sites.createSite.useMutation({
    onSuccess: () => utils.clubs.getClubById.invalidate(clubId),
  });
  const onSubmit: SubmitHandler<SiteFormValues> = (data) => {
    createSite.mutate({ clubId, ...data });
  };

  const onError: SubmitErrorHandler<SiteFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("create-site")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText="Enregistrer"
      errors={errors}
      buttonIcon={<CgAdd size={16} />}
      onOpenModal={() => {
        setRooms([]);
        reset();
      }}
      className="w-11/12 max-w-5xl"
    >
      <h3>{t("create-new-site")}</h3>
      <p className="py-4">{t("enter-info-new-site")}</p>
      <SiteForm
        register={register}
        errors={errors}
        rooms={rooms}
        setRooms={setRooms}
        clubId={clubId}
      />
    </Modal>
  );
};

type UpdateSiteProps = {
  clubId: string;
  siteId: string;
};

export const UpdateSite = ({ clubId, siteId }: UpdateSiteProps) => {
  const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SiteFormValues>();
  const [rooms, setRooms] = useState<RoomFormValues[]>([]);
  const querySite = trpc.sites.getSiteById.useQuery(siteId, {
    onSuccess(data) {
      if (data) reset(data);
    },
  });
  const updateSite = trpc.sites.updateSite.useMutation({
    onSuccess: () => {
      utils.sites.getSiteById.invalidate(siteId);
    },
  });
  const { t } = useTranslation("club");

  const onSubmit: SubmitHandler<SiteFormValues> = (data) => {
    console.log("data", data);
    updateSite.mutate({ id: siteId, ...data });
  };

  const onError: SubmitErrorHandler<SiteFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={querySite.data?.name}
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText={t("update-site")}
      errors={errors}
      onOpenModal={() => {
        setRooms([]);
        reset();
      }}
      buttonIcon={<CgPen size={16} />}
      variant={ModalVariant.ICON_OUTLINED_PRIMARY}
      className="w-2/3 max-w-5xl"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-4">
          {t("update-site")}
          <span className="text-primary">{querySite?.data?.name}</span>
        </h3>
      </div>
      <SiteForm
        register={register}
        errors={errors}
        rooms={rooms}
        setRooms={setRooms}
        clubId={clubId}
        siteId={siteId}
      />
    </Modal>
  );
};

type PropsUpdateDelete = {
  clubId: string;
  siteId: string;
  variant?: ModalVariant;
};

export const DeleteSite = ({
  clubId,
  siteId,
  variant = ModalVariant.ICON_OUTLINED_SECONDARY,
}: PropsWithoutRef<PropsUpdateDelete>) => {
  const utils = trpc.useContext();
  const { data: sessionData } = useSession();
  const { t } = useTranslation("club");

  const deleteSite = trpc.sites.deleteSite.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      utils.clubs.getClubById.invalidate(clubId);
    },
  });

  return (
    <Confirmation
      message={t("site-deletion-message")}
      title={t("site-deletion")}
      buttonIcon={<CgTrash size={16} />}
      onConfirm={() => {
        deleteSite.mutate(siteId);
      }}
      variant={variant}
    />
  );
};

type SiteFormProps<T extends FieldValues> = {
  errors?: FieldErrorsImpl;
  register: UseFormRegister<T>;
  rooms: RoomFormValues[];
  setRooms: Dispatch<SetStateAction<RoomFormValues[]>>;
  clubId: string;
  siteId?: string;
};

function SiteForm<T extends FieldValues>({
  errors,
  register,
}: SiteFormProps<T>): JSX.Element {
  return (
    <SimpleForm
      errors={errors}
      register={register}
      fields={[
        {
          label: "Nom du site",
          name: "name",
          required: "Le nom est obligatoire",
        },
        {
          label: "Adresse",
          name: "address",
          required: "Adresse obligatoire",
        },
      ]}
    />
  );
}

type NewRoomProps = {
  siteId?: string;
  clubId: string;
  variant?: ModalVariant;
};

export const RESERVATIONS = [
  { value: RoomReservation.NONE, label: "no-reservation" },
  { value: RoomReservation.POSSIBLE, label: "reservation-possible" },
  { value: RoomReservation.MANDATORY, label: "reservation-mandatory" },
];

export const NewRoom = ({
  clubId,
  siteId,
  variant = ModalVariant.ICON_OUTLINED_PRIMARY,
}: NewRoomProps) => {
  const utils = trpc.useContext();
  const createRoom = trpc.sites.createRoom.useMutation({
    onSuccess: () => {
      utils.sites.getSitesForClub.invalidate(clubId);
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

export const ManageRooms = ({
  clubId,
  siteId,
  variant = ModalVariant.ICON_OUTLINED_SECONDARY,
}: NewRoomProps) => {
  const utils = trpc.useContext();
  const createRoom = trpc.sites.createRoom.useMutation({
    onSuccess: () => {
      utils.sites.getSitesForClub.invalidate(clubId);
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
      createRoom.mutate({ siteId, ...data, capacity: Number(data.capacity) });
  };

  const onError: SubmitErrorHandler<RoomFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("manage-room")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      buttonIcon={<CgPen size={24} />}
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
