import { getProviders, signIn } from "next-auth/react";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import SimpleForm from "@ui/simpleform";
import { useForm } from "react-hook-form";

type EmailFormValues = {
  email: string;
};

export default function SignIn({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation("auth");
  const {
    register,
    formState: { errors },
  } = useForm<EmailFormValues>();

  console.log("providers", providers);

  return (
    <div className="grid h-screen place-items-center">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">{t("connect")}</h2>
          {providers
            ? Object.values(providers)
                .filter((p) => p.id !== "email")
                .map((provider) => (
                  <button
                    className="btn-outline btn w-full"
                    key={provider.name}
                    onClick={() => signIn(provider.id)}
                  >
                    {t("connect-with-account")} {provider.name}
                  </button>
                ))
            : null}
          <div className="divider">{t("or")}</div>
          <SimpleForm
            register={register}
            errors={errors}
            fields={[
              {
                name: "email",
                label: t("my-email"),
                type: "email",
                required: true,
              },
            ]}
          />
          <button
            className="btn-outline btn w-full"
            onClick={() => signIn("email")}
          >
            {t("connect-with-account")} {"Email"}
          </button>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  const providers = await getProviders();
  return {
    props: {
      providers,
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "auth"],
        nextI18nConfig
      )),
    },
  };
}
