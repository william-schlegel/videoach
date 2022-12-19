import { trpc } from "../../utils/trpc";
import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
  type FieldErrorsImpl,
  type UseFormRegister,
  type FieldValues,
} from "react-hook-form";
import Modal, { type TModalVariant } from "../ui/modal";
import SimpleForm from "../ui/simpleform";
import { CgAdd, CgPen, CgTrash } from "react-icons/cg";
import { type PropsWithoutRef } from "react";
import { useSession } from "next-auth/react";
import Confirmation from "@ui/confirmation";
import { useTranslation } from "next-i18next";

type SiteFormValues = {
  name: string;
  address: string;
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
      onOpenModal={() => reset()}
      className="w-11/12 max-w-5xl"
    >
      <h3>{t("create-new-site")}</h3>
      <p className="py-4">{t("enter-info-new-site")}</p>
      <SiteForm register={register} errors={errors} />
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
  } = useForm<SiteFormValues>();
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
      title={t("update-site-name", { siteName: querySite.data?.name })}
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText={t("update-site")}
      errors={errors}
      buttonIcon={<CgPen size={16} />}
      variant={"Icon-Outlined-Primary"}
      className="w-2/3 max-w-5xl"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-4">
          {t("update-site")}
          <span className="text-primary">{querySite?.data?.name}</span>
        </h3>
      </div>
      <SiteForm register={register} errors={errors} />
    </Modal>
  );
};

type PropsUpdateDelete = {
  clubId: string;
  siteId: string;
  variant?: TModalVariant;
};

export const DeleteSite = ({
  clubId,
  siteId,
  variant = "Icon-Outlined-Secondary",
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
};

function SiteForm<T extends FieldValues>({
  errors,
  register,
}: SiteFormProps<T>): JSX.Element {
  const { t } = useTranslation("club");
  return (
    <SimpleForm
      errors={errors}
      register={register}
      fields={[
        {
          label: t("site-name"),
          name: "name",
          required: t("name-mandatory"),
        },
        {
          label: t("site-address"),
          name: "address",
          required: t("address-mandatory"),
        },
      ]}
    />
  );
}
