import Modal, { type TModalVariant } from "@ui/modal";
import Confirmation from "@ui/confirmation";
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
import { trpc } from "@trpcclient/trpc";

type CreatePlanningProps = {
  clubId: string;
  variant?: TModalVariant;
};

type CreatePlanningFormValues = {
  name: string;
};

export const CreatePlanning = ({
  clubId,
  variant = "Primary",
}: CreatePlanningProps) => {
  const utils = trpc.useContext();
  const createPlanning = trpc.plannings.createPlanningForClub.useMutation({
    onSuccess: () => {
      utils.plannings.getPlanningsForClub.invalidate(clubId);
      toast.success(t("planning-created") as string);
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
  } = useForm<CreatePlanningFormValues>();

  const { t } = useTranslation("planning");

  const onSubmit: SubmitHandler<CreatePlanningFormValues> = (data) => {
    console.log("data", data);
    createPlanning.mutate({
      clubId,
      ...data,
    });
  };

  const onError: SubmitErrorHandler<CreatePlanningFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("create-new-planning")}
      variant={variant}
      handleSubmit={handleSubmit(onSubmit, onError)}
    >
      <h3>{t("create-new-planning")}</h3>
      <SimpleForm
        errors={errors}
        register={register}
        fields={[
          {
            label: t("name"),
            name: "name",
          },
        ]}
      />
    </Modal>
  );
};
