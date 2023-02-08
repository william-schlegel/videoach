import useLocalStorage from "@lib/useLocalstorage";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import Layout from "@root/src/components/layout";
import { type TThemes } from "@root/src/components/themeSelector";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { getProviders, signIn } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useRouter } from "next/router";
import { useState } from "react";

export default function SignIn({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const router = useRouter();
  const [theme] = useLocalStorage<TThemes>("theme", "cupcake");

  const signInEmail = router.query.email;
  if (signInEmail)
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-base-200"
        data-theme={theme}
      >
        <div className="rounded border border-primary bg-base-100 p-12 text-center">
          <h1>{t("continue-with-link")}</h1>
          <p className="text-lg font-semibold">
            {t("check-your-mail", { email: signInEmail })}
          </p>
          <p>{t("close-page")}</p>
        </div>
      </div>
    );

  return (
    <Layout title={t("connect")} className="grid h-screen place-items-center">
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
                    onClick={() => signIn(provider.id, { redirect: true })}
                  >
                    {t("connect-with-account")} {provider.name}
                  </button>
                ))
            : null}
          <div className="divider">{t("or")}</div>
          <form
            onSubmit={() => signIn("email", { email, redirect: true })}
            className="grid grid-cols-[auto,1fr] gap-2"
          >
            <label className="required">{t("my-email")}</label>
            <input
              type="email"
              required
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-bordered input w-full"
            />
            <div className="col-span-full flex flex-col gap-4">
              <p>{t("magic-link")}</p>
              <button type="submit" className="btn-outline btn w-full">
                {t("connect-with-account")} {"Email"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
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
