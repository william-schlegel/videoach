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
import { type PropsWithoutRef } from "react";
import { useSession } from "next-auth/react";
import Confirmation from "@ui/confirmation";
import { useTranslation } from "next-i18next";
import { toast } from "react-toastify";

type SubscriptionFormValues = {
  name: string;
  description: string;
  highlight: string;
  startDate: Date;
  monthly: number;
  yearly: number;
  cancelationFee: number;
};

type CreateSubscriptionProps = {
  clubId: string;
};

export const CreateSubscription = ({ clubId }: CreateSubscriptionProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubscriptionFormValues>();
  const utils = trpc.useContext();
  const { t } = useTranslation("club");

  const createSubscription = trpc.subscriptions.createSubscription.useMutation({
    onSuccess: () => {
      utils.clubs.getClubById.invalidate(clubId);
      utils.subscriptions.getSubscriptionsForClub.invalidate(clubId);
      toast.success(t("subscription.created") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const onSubmit: SubmitHandler<SubscriptionFormValues> = (data) => {
    console.log("data :>> ", data);
    createSubscription.mutate({ clubId, ...data });
  };

  const onError: SubmitErrorHandler<SubscriptionFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("subscription.create")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      errors={errors}
      buttonIcon={<i className="bx bx-plus bx-xs" />}
      onOpenModal={() => reset()}
      className="w-11/12 max-w-3xl"
    >
      <h3>{t("subscription.create-new")}</h3>
      <SubscriptionForm register={register} errors={errors} />
    </Modal>
  );
};

type UpdateSubscriptionProps = {
  subscriptionId: string;
  clubId: string;
};

export const UpdateSubscription = ({
  subscriptionId,
  clubId,
}: UpdateSubscriptionProps) => {
  const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubscriptionFormValues>();
  const querySubscription = trpc.subscriptions.getSubscriptionById.useQuery(
    subscriptionId,
    {
      onSuccess(data) {
        if (data) reset(data);
      },
    }
  );
  const updateSubscription = trpc.subscriptions.updateSubscription.useMutation({
    onSuccess: () => {
      utils.subscriptions.getSubscriptionById.invalidate(subscriptionId);
      utils.subscriptions.getSubscriptionsForClub.invalidate(clubId);
      toast.success(t("subscription.updated") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const { t } = useTranslation("club");

  const onSubmit: SubmitHandler<SubscriptionFormValues> = (data) => {
    console.log("data", data);
    updateSubscription.mutate({ id: subscriptionId, ...data });
  };

  const onError: SubmitErrorHandler<SubscriptionFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("subscription.update", {
        subscriptionName: querySubscription.data?.name,
      })}
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText={t("subscription.update")}
      errors={errors}
      buttonIcon={<i className="bx bx-edit bx-sm" />}
      variant={"Icon-Outlined-Primary"}
      className="w-11/12 max-w-3xl"
    >
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-4">
          {t("subscription.update")}
          <span className="text-primary">{querySubscription?.data?.name}</span>
        </h3>
      </div>
      <SubscriptionForm register={register} errors={errors} />
    </Modal>
  );
};

type PropsUpdateDelete = {
  clubId: string;
  subscriptionId: string;
  variant?: TModalVariant;
};

export const DeleteSubscription = ({
  clubId,
  subscriptionId,
  variant = "Icon-Outlined-Secondary",
}: PropsWithoutRef<PropsUpdateDelete>) => {
  const utils = trpc.useContext();
  const { data: sessionData } = useSession();
  const { t } = useTranslation("club");

  const deleteSubscription = trpc.subscriptions.deleteSubscription.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      utils.clubs.getClubById.invalidate(clubId);
      toast.success(t("subscription.deleted") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("subscription.deletion-message")}
      title={t("subscription.deletion")}
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      onConfirm={() => {
        deleteSubscription.mutate(subscriptionId);
      }}
      variant={variant}
    />
  );
};

type SubscriptionFormProps<T extends FieldValues> = {
  errors?: FieldErrorsImpl;
  register: UseFormRegister<T>;
};

function SubscriptionForm<T extends FieldValues>({
  errors,
  register,
}: SubscriptionFormProps<T>): JSX.Element {
  const { t } = useTranslation("club");
  return (
    <SimpleForm
      errors={errors}
      register={register}
      fields={[
        {
          label: t("subscription.name"),
          name: "name",
          required: t("subscription.name-mandatory"),
        },
        {
          label: t("subscription.description"),
          name: "description",
          required: true,
          rows: 3,
        },
        {
          label: t("subscription.highlight"),
          name: "highlight",
        },
        {
          label: t("subscription.start-date"),
          name: "startDate",
          type: "date",
          required: t("subscription.start-date-mandatory"),
        },
        {
          label: t("subscription.monthly"),
          name: "monthly",
          type: "number",
          unit: t("subscription.per-month"),
        },
        {
          label: t("subscription.yearly"),
          name: "yearly",
          type: "number",
          unit: t("subscription.per-year"),
        },
        {
          label: t("subscription.cancelation-fee"),
          name: "cancelationFee",
          type: "number",
          unit: "€",
        },
      ]}
    />
  );
}
