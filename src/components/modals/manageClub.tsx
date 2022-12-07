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
import Spinner from "../ui/spinner";
import Confirmation from "../ui/confirmation";
import { CgTrash } from "react-icons/cg";
import AddActivity from "./manageActivity";
import { CreateSite, UpdateSite } from "./manageSite";
import { ModalVariant } from "../ui/modal";

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

type ClubContentProps = {
  userId: string;
  clubId: string;
};

type ClubFormValues = {
  name: string;
  address: string;
};

export function ClubContent({ userId, clubId }: ClubContentProps) {
  const { data: sessionData } = useSession();
  const clubQuery = trpc.clubs.getClubById.useQuery(clubId, {
    onSuccess(data) {
      reset({ name: data?.name, address: data?.address });
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClubFormValues>();
  const utils = trpc.useContext();
  const updateClub = trpc.clubs.updateClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      utils.clubs.getClubById.invalidate(clubId);
    },
  });
  const deleteClub = trpc.clubs.deleteClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      utils.clubs.getClubById.invalidate(clubId);
    },
  });
  const deleteSite = trpc.sites.deleteSite.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      utils.clubs.getClubById.invalidate(clubId);
    },
  });

  const onSubmit: SubmitHandler<ClubFormValues> = (data) => {
    updateClub.mutate({ id: clubId, ...data });
  };

  if (clubQuery.isLoading) return <Spinner />;

  return (
    <div className="flex flex-wrap items-start gap-4">
      <SimpleForm
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
        ]}
        errors={errors}
        onSubmit={handleSubmit(onSubmit)}
        className="w-1/2"
      >
        <div className="col-span-2 mt-4 flex flex-1 justify-end gap-4 border-t border-primary pt-4">
          <Confirmation
            message="Voulez-vou réellement supprimer ce club ?\nCette action est irréversible"
            title="Supprimer ce club"
            onConfirm={() => {
              deleteClub.mutate(clubId);
            }}
          />
          <button className="btn btn-primary" type="submit">
            Enregistrer les modifications
          </button>
        </div>
      </SimpleForm>
      <div className="flex flex-1 flex-col gap-4">
        <div className="rounded border border-primary p-4">
          <div className="mb-4 flex flex-row items-center gap-8">
            <h3>Sites</h3>
            <CreateSite clubId={clubId} />
          </div>
          {clubQuery?.data?.sites?.map((site) => (
            <div key={site.id} className="my-2 flex items-center gap-4">
              <UpdateSite clubId={clubId} siteId={site.id} />
              <div className=""> {site.address} </div>
              <Confirmation
                message="Voulez-vou réellement supprimer ce site ?\nCette action est irréversible"
                title="Supprimer"
                buttonIcon={<CgTrash size={16} />}
                onConfirm={() => {
                  deleteSite.mutate(site.id);
                }}
                variant={ModalVariant.ICON_OUTLINED_SECONDARY}
              />
            </div>
          ))}
        </div>
        <div className="rounded border border-primary p-4">
          <div className="mb-4 flex flex-row items-center gap-8">
            <h3>Activités</h3>
            <AddActivity
              clubId={clubId}
              userId={userId}
              onSuccess={() => {
                utils.clubs.getClubById.invalidate(clubId);
              }}
              withAdd
              withUpdate
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {clubQuery?.data?.activities?.map((activity) => (
              <span
                key={activity.id}
                className="rounded-full border border-neutral bg-base-100 px-4 py-2 text-neutral"
              >
                {activity.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateClub;
