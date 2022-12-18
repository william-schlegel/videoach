import { type PropsWithoutRef } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "../../utils/trpc";
import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
} from "react-hook-form";
import Modal from "../ui/modal";
import SimpleForm from "../ui/simpleform";
import { CgAdd, CgPen, CgTrash } from "react-icons/cg";
import Confirmation from "../ui/confirmation";
import { useTranslation } from "next-i18next";

type ClubFormValues = {
  name: string;
  address: string;
};

type ClubCreateFormValues = {
  isSite: boolean;
} & ClubFormValues;

export const CreateClub = () => {
  const { data: sessionData } = useSession();
  const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClubCreateFormValues>();
  const { t } = useTranslation("club");

  const createClub = trpc.clubs.createClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
    },
  });

  const onSubmit: SubmitHandler<ClubCreateFormValues> = (data) => {
    console.log("data", data);
    createClub.mutate({ userId: sessionData?.user?.id ?? "", ...data });
  };

  const onError: SubmitErrorHandler<ClubCreateFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("create-new-club")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText="Enregistrer"
      errors={errors}
      buttonIcon={<CgAdd size={24} />}
      onOpenModal={() => reset()}
    >
      <h3>{t("create-new-club")}</h3>
      <p className="py-4">{t("enter-new-club-info")}</p>
      <SimpleForm
        errors={errors}
        register={register}
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
                  <span className="label-text">{t("is-site")}</span>
                </label>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};

type PropsUpdateDelete = {
  clubId: string;
};

export const UpdateClub = ({ clubId }: PropsWithoutRef<PropsUpdateDelete>) => {
  const { data: sessionData } = useSession();
  const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClubFormValues>();
  const { t } = useTranslation("club");
  const queryClub = trpc.clubs.getClubById.useQuery(clubId, {
    onSuccess(data) {
      reset({
        address: data?.address,
        name: data?.name,
      });
    },
  });
  const updateClub = trpc.clubs.updateClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      utils.clubs.getClubById.invalidate(clubId);
    },
  });

  const onSubmit: SubmitHandler<ClubFormValues> = (data) => {
    updateClub.mutate({ id: clubId, ...data });
  };

  const onError: SubmitErrorHandler<ClubFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("update-club")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText="Enregistrer"
      errors={errors}
      buttonIcon={<CgPen size={16} />}
      variant={"Icon-Outlined-Primary"}
    >
      <h3>
        {t("update-the-club")} {queryClub.data?.name}
      </h3>
      <SimpleForm
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
      />
    </Modal>
  );
};

export const DeleteClub = ({ clubId }: PropsWithoutRef<PropsUpdateDelete>) => {
  const utils = trpc.useContext();
  const { data: sessionData } = useSession();
  const { t } = useTranslation("club");

  const deleteClub = trpc.clubs.deleteClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      utils.clubs.getClubById.invalidate(clubId);
    },
  });

  return (
    <Confirmation
      message={t("club-deletion-message")}
      title={t("club-deletion")}
      onConfirm={() => {
        deleteClub.mutate(clubId);
      }}
      buttonIcon={<CgTrash size={16} />}
      variant={"Icon-Outlined-Secondary"}
    />
  );
};

export default CreateClub;
