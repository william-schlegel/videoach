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
import { CgAdd, CgTrash } from "react-icons/cg";
import { type Dispatch, type SetStateAction, useState } from "react";
import { RoomReservation } from "@prisma/client";
import { uuid } from "uuidv4";

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

  const createSite = trpc.sites.createSite.useMutation({
    onSuccess: () => utils.clubs.getClubById.invalidate(clubId),
  });
  const createRoom = trpc.sites.createRooms.useMutation();

  const onSubmit: SubmitHandler<SiteFormValues> = (data) => {
    createSite.mutate(
      { clubId, ...data },
      {
        onSuccess(data) {
          createRoom.mutate(
            rooms.map((room) => ({ siteId: data.id, ...room }))
          );
        },
      }
    );
  };

  const onError: SubmitErrorHandler<SiteFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title="Créer un nouveau site"
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText="Enregistrer"
      errors={errors}
      buttonIcon={<CgAdd size={16} />}
      onOpenModal={() => {
        setRooms([]);
        reset();
      }}
    >
      <h3>Créer un nouveau site</h3>
      <p className="py-4">
        Saisissez les informations relatives à votre nouveau site
        d&apos;activités
      </p>
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
      submitButtonText="Mettre à jour le site"
      errors={errors}
      onOpenModal={() => {
        setRooms([]);
        reset();
      }}
      variant={ModalVariant.OUTLINED_PRIMARY}
    >
      <h3>Mettre à jour le site {querySite?.data?.name}</h3>
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
  rooms,
  setRooms,
  clubId,
  siteId,
}: SiteFormProps<T>): JSX.Element {
  return (
    <>
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
      <div className="divider"></div>
      <div className="flex items-center gap-4">
        <h3>Salles</h3>
        <NewRoom clubId={clubId} siteId={siteId} />
      </div>
      {/*rooms?.map((room, idx) => (
        <div key={idx} className="my-2 flex items-center gap-2">
          <CgTrash size={16} color="red" onClick={() => deleteRoom(idx)} />
        </div>
      ))*/}
    </>
  );
}

type NewRoomProps = {
  siteId?: string;
  clubId: string;
};

export const RESERVATIONS = [
  { value: RoomReservation.NONE, label: "Pas de réservation " },
  { value: RoomReservation.POSSIBLE, label: "Possible" },
  { value: RoomReservation.MANDATORY, label: "Obligatoire" },
];

const NewRoom = ({ clubId, siteId }: NewRoomProps) => {
  const utils = trpc.useContext();
  const createRoom = trpc.sites.createRoom.useMutation({
    onSuccess: () => utils.sites.getSitesForClub.invalidate(clubId),
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<RoomFormValues>();

  const onSubmit: SubmitHandler<RoomFormValues> = (data) => {
    console.log("data", data);
    if (siteId) createRoom.mutate({ siteId, ...data });
  };

  const onError: SubmitErrorHandler<RoomFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title="Nouvelle salle"
      handleSubmit={handleSubmit(onSubmit, onError)}
    >
      <h3>Créer une nouvelle salle</h3>
      <SimpleForm
        errors={errors}
        register={register}
        fields={[
          {
            label: "Nom de la salle",
            name: "name",
            required: "Le nom est obligatoire",
          },
          {
            label: "Capacité",
            name: "capacity",
            type: "number",
          },
          {
            name: "reservation",
            component: (
              <select
                className="select-bordered select w-full"
                {...register("reservation")}
              >
                {RESERVATIONS.map((reservation) => (
                  <option
                    key={reservation.value}
                    value={reservation.value}
                    selected={reservation.value === getValues("reservation")}
                  >
                    {reservation.label}
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
