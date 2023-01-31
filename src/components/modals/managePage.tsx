import { trpc } from "../../utils/trpc";
import Modal, { getButtonSize, type TModalVariant } from "../ui/modal";
import Confirmation from "../ui/confirmation";
import { useTranslation } from "next-i18next";
import { type ButtonSize } from "@ui/buttonIcon";
import Spinner from "@ui/spinner";
import { toast } from "react-toastify";
import { type PageSectionModel, type PageTarget } from "@prisma/client";
import SimpleForm from "@ui/simpleform";
import {
  type Path,
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
} from "react-hook-form";

type CreatePageProps = {
  clubId: string;
  variant?: TModalVariant;
};

export const PAGE_TARGET_LIST: readonly {
  readonly value: PageTarget;
  readonly label: string;
}[] = [
  { value: "HOME", label: "target.home" },
  { value: "OFFERS", label: "target.offers" },
  { value: "ACTIVITIES", label: "target.activities" },
  { value: "ACTIVITY", label: "target.activity" },
  { value: "CONTACT", label: "target.contact" },
  { value: "PLANS", label: "target.plans" },
  { value: "PRESENTATION", label: "target.presentation" },
  { value: "TEAM", label: "target.team" },
  { value: "PLANNING", label: "target.planning" },
  { value: "VIDEOS", label: "target.videos" },
] as const;

export const PAGE_SECTION_LIST: readonly {
  readonly value: PageSectionModel;
  readonly label: string;
}[] = [
  { value: "HERO", label: "section.hero" },
  { value: "ACTIVITY_GROUPS", label: "section.activity-groups" },
  { value: "ACTIVITIES", label: "section.activity-details" },
  { value: "LOCATION", label: "section.location" },
  { value: "CONTACT", label: "section.contact" },
  { value: "SOCIAL", label: "section.social" },
  { value: "FEATURES", label: "section.features" },
  { value: "FOOTER", label: "section.footer" },
] as const;

type CreatePageFormValues = {
  name: string;
  target: PageTarget;
};

export const CreatePage = ({
  clubId,
  variant = "Primary",
}: CreatePageProps) => {
  const utils = trpc.useContext();
  const createPage = trpc.pages.createPage.useMutation({
    onSuccess: () => {
      utils.pages.getPagesForClub.invalidate(clubId);
      toast.success(t("club.page-created"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<CreatePageFormValues>();

  const { t } = useTranslation("pages");

  const onSubmit: SubmitHandler<CreatePageFormValues> = (data) => {
    console.log("data", data);
    createPage.mutate({
      clubId,
      ...data,
    });
  };

  const onError: SubmitErrorHandler<CreatePageFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("club.create-new-page")}
      variant={variant}
      handleSubmit={handleSubmit(onSubmit, onError)}
    >
      <h3>{t("club.create-new-page")}</h3>
      <SimpleForm
        errors={errors}
        register={register}
        fields={[
          {
            label: t("club.page-name"),
            name: "name",
            required: t("club.name-mandatory"),
          },
          {
            label: t("club.page-target"),
            name: "target",
            component: (
              <select
                defaultValue={getValues("target" as Path<CreatePageFormValues>)}
                {...register("target" as Path<CreatePageFormValues>)}
              >
                {PAGE_TARGET_LIST.map((target) => (
                  <option key={target.value} value={target.value}>
                    {t(target.label)}
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

type UpdatePageProps = {
  clubId: string;
  pageId: string;
  variant?: TModalVariant;
  size?: ButtonSize;
};

export function UpdatePage({
  clubId,
  pageId,
  variant = "Icon-Outlined-Primary",
  size = "sm",
}: UpdatePageProps) {
  const utils = trpc.useContext();
  const pageQuery = trpc.pages.getPageById.useQuery(pageId, {
    onSuccess(data) {
      reset({
        name: data?.name,
        target: data?.target,
      });
    },
  });
  const updatePage = trpc.pages.updatePage.useMutation({
    onSuccess: () => {
      utils.pages.getPagesForClub.invalidate(clubId);
      toast.success(t("club.page-updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
  } = useForm<CreatePageFormValues>();

  const { t } = useTranslation("pages");

  const onSubmit: SubmitHandler<CreatePageFormValues> = (data) => {
    console.log("data", data);
    updatePage.mutate({
      id: pageId,
      ...data,
    });
  };

  const onError: SubmitErrorHandler<CreatePageFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("club.update-page")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      buttonIcon={<i className={`bx bx-edit ${getButtonSize(size)}`} />}
      variant={variant}
      buttonSize={size}
    >
      <h3 className="space-x-2">
        {t("club.update-page")}
        <span className="text-primary">{pageQuery.data?.name}</span>
      </h3>
      {pageQuery.isLoading ? (
        <Spinner />
      ) : (
        <SimpleForm
          errors={errors}
          register={register}
          fields={[
            {
              label: t("club.page-name"),
              name: "name",
              required: t("club.name-mandatory"),
            },
            {
              label: t("club.page-target"),
              name: "target",
              component: (
                <select
                  defaultValue={getValues(
                    "target" as Path<CreatePageFormValues>
                  )}
                  {...register("target" as Path<CreatePageFormValues>)}
                >
                  {PAGE_TARGET_LIST.map((target) => (
                    <option key={target.value} value={target.value}>
                      {t(target.label)}
                    </option>
                  ))}
                </select>
              ),
            },
          ]}
        />
      )}
    </Modal>
  );
}

type DeletePageProps = {
  clubId: string;
  pageId: string;
  variant?: TModalVariant;
  size?: ButtonSize;
};

export function DeletePage({
  pageId,
  clubId,
  size = "sm",
  variant = "Icon-Outlined-Secondary",
}: DeletePageProps) {
  const utils = trpc.useContext();
  const deletePage = trpc.pages.deletePage.useMutation({
    onSuccess: () => {
      utils.pages.getPagesForClub.invalidate(clubId);
      toast.success(t("club.page-deleted"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const { t } = useTranslation("pages");

  return (
    <Confirmation
      title={t("club.page-deletion")}
      message={t("club.page-deletion-message")}
      onConfirm={() => deletePage.mutate(pageId)}
      buttonIcon={<i className={`bx bx-trash ${getButtonSize(size)}`} />}
      variant={variant}
      textConfirmation={t("club.page-deletion-confirmation")}
      buttonSize={size}
    />
  );
}
