import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { trpc } from "../../utils/trpc";
import { ROLE_LIST } from "./[userId]";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";

type FormValues = {
  name: string;
  email: string;
  role: Role;
};
function NewUser() {
  const { data: sessionData } = useSession();
  const { register, handleSubmit, getValues } = useForm<FormValues>();
  const updateUser = trpc.users.updateUser.useMutation();
  const onSubmit: SubmitHandler<FormValues> = (data) =>
    updateUser.mutate({ id: sessionData?.user?.id || "", ...data });

  const { t } = useTranslation("auth");

  return (
    <div className="container mx-auto p-8">
      <h1>
        {t("welcome")} {sessionData?.user?.name}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset>
          <label htmlFor="name">{t("change-my-name")}</label>
          <input className="input" {...register("name")} />
        </fieldset>
        <fieldset>
          <label htmlFor="role">{t("role")}</label>
          <select
            id="role"
            className="select-bordered select w-full max-w-xs"
            {...register("role")}
            value={getValues("role")}
          >
            {ROLE_LIST.filter((rl) => rl.value !== Role.ADMIN).map((rl) => (
              <option key={rl.value} value={rl.value}>
                {rl.label}
              </option>
            ))}
          </select>
        </fieldset>
        <button className="btn-primary btn">{t("save-profile")}</button>
      </form>
    </div>
  );
}

export default NewUser;

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
