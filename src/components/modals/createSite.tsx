import { trpc } from "../../utils/trpc";
import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
} from "react-hook-form";
import Modal from "../ui/modal";
import SimpleForm from "../ui/simpleform";
import { CgAdd, CgTrash } from "react-icons/cg";
import { useState } from "react";

type FormValues = {
  name: string;
  address: string;
};

type CreateSiteProps = {
  clubId: string;
};

const CreateSite = ({ clubId }: CreateSiteProps) => {
  const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();
  const [rooms, setRooms] = useState<string[] | null>(null);

  const createSite = trpc.sites.createSite.useMutation({
    onSuccess: () => {
      utils.sites.getSitesForClub.invalidate(clubId);
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("data", data);
    createSite.mutate({ clubId, ...data });
  };

  const onError: SubmitErrorHandler<FormValues> = (errors) => {
    console.log("errors", errors);
  };

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
    <Modal
      title="Créer un nouveau site"
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText="Enregistrer"
      errors={errors}
      buttonIcon={<CgAdd size={24} />}
    >
      <h3>Créer un nouveau site</h3>
      <p className="py-4">
        Saisissez les informations relatives à votre nouveau site
        d&apos;activités
      </p>
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
          <CgAdd size={24} />
          Ajouter
        </button>
      </div>
      {rooms?.map((room, idx) => (
        <div key={idx} className="my-2 flex items-center gap-2">
          <input
            value={room}
            onChange={(e) => handleChangeRoom(idx, e.target.value)}
          />
          <CgTrash size={24} color="red" onClick={() => deleteRoom(idx)} />
        </div>
      ))}
    </Modal>
  );
};

export default CreateSite;
