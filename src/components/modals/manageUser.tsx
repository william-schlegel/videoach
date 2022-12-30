import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
  type FieldValues,
  type FieldErrorsImpl,
  type UseFormRegister,
  type UseFormGetValues,
  type Path,
} from "react-hook-form";
import Modal, { type TModalVariant } from "../ui/modal";
import SimpleForm from "../ui/simpleform";
import { type PropsWithoutRef } from "react";
import type { Role } from "@prisma/client";
import Confirmation from "@ui/confirmation";
import { useTranslation } from "next-i18next";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import { ROLE_LIST } from "@root/src/pages/user/[userId]";
import { toast } from "react-toastify";

type UserFormValues = {
  name: string;
  email: string;
  role: Role;
};

type PropsUpdateDelete = {
  userId: string;
  variant?: TModalVariant;
};

export const UpdateUser = ({
  userId,
  variant = "Icon-Outlined-Primary",
}: PropsUpdateDelete) => {
  const utils = trpc.useContext();
  const queryUser = trpc.users.getUserById.useQuery(userId, {
    onSuccess(data) {
      if (data)
        reset({
          name: data.name ?? "",
          email: data.email ?? "",
          role: data.role ?? "MEMBER",
        });
    },
  });
  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess: () => {
      utils.users.getUserById.invalidate(userId);
      utils.users.getUserFullById.invalidate(userId);
      reset();
      toast.success(t("user-updated") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    getValues,
  } = useForm<UserFormValues>();
  const { t } = useTranslation("auth");

  const onSubmit: SubmitHandler<UserFormValues> = (data) => {
    console.log("data", data);
    updateUser.mutate({
      id: userId,
      ...data,
    });
  };

  const onError: SubmitErrorHandler<UserFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <>
      <Modal
        title={t("update-user")}
        handleSubmit={handleSubmit(onSubmit, onError)}
        buttonIcon={<i className="bx bx-edit bx-sm" />}
        variant={variant}
      >
        <h3>{t("update-user")}</h3>
        {queryUser.isLoading ? (
          <Spinner />
        ) : (
          <UserForm register={register} errors={errors} getValues={getValues} />
        )}
      </Modal>
    </>
  );
};

export const DeleteUser = ({
  userId,
  variant = "Icon-Outlined-Secondary",
}: PropsWithoutRef<PropsUpdateDelete>) => {
  const utils = trpc.useContext();
  const { t } = useTranslation("auth");

  const deleteUser = trpc.users.deleteUser.useMutation({
    onSuccess: () => {
      utils.users.getAllUsers.invalidate();
      toast.success(t("user-deleted") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("user-deletion-message")}
      title={t("user-deletion")}
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      onConfirm={() => {
        deleteUser.mutate(userId);
      }}
      variant={variant}
    />
  );
};

type UserFormProps<T extends FieldValues> = {
  errors?: FieldErrorsImpl;
  register: UseFormRegister<T>;
  getValues: UseFormGetValues<T>;
};

function UserForm<T extends FieldValues>({
  errors,
  register,
}: UserFormProps<T>): JSX.Element {
  const { t } = useTranslation("auth");
  return (
    <SimpleForm
      errors={errors}
      register={register}
      fields={[
        {
          label: t("name"),
          name: "name",
          required: t("user-name-mandatory"),
        },
        {
          label: t("email"),
          name: "email",
          type: "email",
          required: t("user-email-mandatory"),
        },
        {
          label: t("role"),
          name: "role",
          component: (
            <select
              className="select-bordered select w-full max-w-xs"
              {...register("role" as Path<T>)}
            >
              {ROLE_LIST.map((rl) => (
                <option key={rl.value} value={rl.value}>
                  {t(rl.label)}
                </option>
              ))}
            </select>
          ),
        },
      ]}
    />
  );
}
