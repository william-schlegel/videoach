import { trpc } from "../../utils/trpc";
import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
} from "react-hook-form";
import Modal from "../ui/modal";
import SimpleForm from "../ui/simpleform";
import { CgAdd } from "react-icons/cg";

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
    </Modal>
  );
};

export default CreateSite;
