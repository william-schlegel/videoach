import { useSession } from "next-auth/react";
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
  isSite: boolean;
};

const CreateClub = () => {
  const { data: sessionData } = useSession();
  const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();

  const createClub = trpc.clubs.createClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    console.log("data", data);
    createClub.mutate({ userId: sessionData?.user?.id ?? "", ...data });
  };

  const onError: SubmitErrorHandler<FormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title="Créer un nouveau club"
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText="Enregistrer"
      errors={errors}
      buttonIcon={<CgAdd size={24} />}
      onOpenModal={() => reset()}
    >
      <h3>Créer un nouveau club</h3>
      <p className="py-4">
        Saisissez les informations relatives à votre nouveau club
      </p>
      <SimpleForm
        errors={errors}
        register={register}
        fields={[
          {
            label: "Nom du club",
            name: "name",
            required: "Le nom est obligatoire",
          },
          {
            label: "Adresse",
            name: "address",
            required: "Adresse obligatoire",
          },
          {
            name: "isSite",
            component: (
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="checkbox-primary checkbox"
                    {...register("isSite")}
                    defaultChecked={true}
                  />
                  <span className="label-text">
                    {"C'est aussi un site d'activités"}
                  </span>
                </label>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};

export default CreateClub;
