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

type FormValues = {
  name: string;
  address: string;
};

type CreateSiteProps = {
  clubId: string;
  onSuccess?: (id: string) => void;
};

export const CreateSite = ({ clubId, onSuccess }: CreateSiteProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();
  const [rooms, setRooms] = useState<string[] | null>(null);

  const createSite = trpc.sites.createSite.useMutation({
    onSuccess: (data) =>
      typeof onSuccess === "function" ? onSuccess(data.id) : {},
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("data", data);
    createSite.mutate({ clubId, ...data });
  };

  const onError: SubmitErrorHandler<FormValues> = (errors) => {
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
        setRooms(null);
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
      />
    </Modal>
  );
};

type UpdateSiteProps = {
  siteId: string;
};

export const UpdateSite = ({ siteId }: UpdateSiteProps) => {
  const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();
  const [rooms, setRooms] = useState<string[] | null>(null);
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

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("data", data);
    updateSite.mutate({ id: siteId, ...data });
  };

  const onError: SubmitErrorHandler<FormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={querySite.data?.name}
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText="Mettre à jour le site"
      errors={errors}
      onOpenModal={() => {
        setRooms(null);
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
      />
    </Modal>
  );
};

type SiteFormProps<T extends FieldValues> = {
  errors?: FieldErrorsImpl;
  register: UseFormRegister<T>;
  rooms: string[] | null;
  setRooms: Dispatch<SetStateAction<string[] | null>>;
};

function SiteForm<T extends FieldValues>({
  errors,
  register,
  rooms,
  setRooms,
}: SiteFormProps<T>): JSX.Element {
  const handleChangeRoom = (idx: number, name: string) => {
    const rs = rooms ? [...rooms] : [""];
    rs[idx] = name;
    setRooms(rs);
  };

  const addRoom = () => {
    const rs = rooms;
    if (!rs) setRooms([""]);
    else {
      rs.push("");
      setRooms([...rs]);
    }
  };

  const deleteRoom = (idx: number) => {
    if (!rooms) return;
    const rs = rooms.filter((_, i) => i !== idx);
    setRooms(rs.length ? [...rs] : null);
  };

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
        <button className="btn-outline btn-secondary btn" onClick={addRoom}>
          <CgAdd size={16} />
          Ajouter
        </button>
      </div>
      {rooms?.map((room, idx) => (
        <div key={idx} className="my-2 flex items-center gap-2">
          <input
            value={room}
            onChange={(e) => handleChangeRoom(idx, e.target.value)}
          />
          <CgTrash size={16} color="red" onClick={() => deleteRoom(idx)} />
        </div>
      ))}
    </>
  );
}
