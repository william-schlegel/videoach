import { Role } from "@prisma/client";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import { useForm, type SubmitHandler } from "react-hook-form";
import SimpleForm from "../../components/ui/simpleform";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";

export const ROLE_LIST = [
  { label: "user", value: Role.MEMBER },
  { label: "coach", value: Role.COACH },
  { label: "manager", value: Role.MANAGER },
  { label: "manager-coach", value: Role.MANAGER_COACH },
  { label: "admin", value: Role.ADMIN },
] as const;

export function getRoleName(role: Role) {
  return ROLE_LIST.find((r) => r.value === role)?.label ?? "???";
}

type FormValues = {
  name: string;
  email: string;
  role: Role;
};

export default function Profile() {
  const router = useRouter();
  const { userId } = router.query;
  const myUserId = (Array.isArray(userId) ? userId[0] : userId) || "";
  const userQuery = trpc.users.getUserById.useQuery(myUserId, {
    onSuccess: (data) => {
      reset({
        name: data?.name || "",
        email: data?.email || "",
        role: data?.role || Role.MEMBER,
      });
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();
  const utils = trpc.useContext();
  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess() {
      utils.users.getUserById.invalidate(myUserId);
    },
  });
  const { t } = useTranslation("auth");
  const onSubmit: SubmitHandler<FormValues> = (data) =>
    updateUser.mutate({
      id: myUserId,
      ...userQuery.data,
      ...data,
    });

  return (
    <article className="mx-auto max-w-5xl">
      <h1>{t("your-profile")}</h1>
      <SimpleForm
        register={register}
        errors={errors}
        onSubmit={handleSubmit(onSubmit)}
        isLoading={userQuery.isLoading}
        fields={[
          {
            label: t("change-name"),
            name: "name",
            required: t("name-mandatory"),
          },
          {
            label: t("my-email"),
            name: "email",
            type: "email",
          },
          {
            label: t("my-role"),
            name: "role",
            component:
              userQuery.data?.role === Role.ADMIN ? (
                <div>{t("admin")}</div>
              ) : (
                <select
                  className="select-bordered select w-full max-w-xs"
                  {...register("role")}
                  defaultValue={userQuery.data?.role}
                >
                  {ROLE_LIST.filter((rl) => rl.value !== Role.ADMIN).map(
                    (rl) => (
                      <option key={rl.value} value={rl.value}>
                        {t(rl.label)}
                      </option>
                    )
                  )}
                </select>
              ),
          },
        ]}
      >
        <button className="btn btn-primary" disabled={updateUser.isLoading}>
          {t("save-profile")}
        </button>
      </SimpleForm>
    </article>
  );
}

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "auth"],
        nextI18nConfig
      )),
    },
  };
}
