import { Role } from "@prisma/client";
import { type GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "../../next-i18next.config.mjs";
import { authOptions } from "./api/auth/[...nextauth]";
import { unstable_getServerSession } from "next-auth/next";
import Image from "next/image.js";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router.js";

const Home = () => {
  const { t } = useTranslation("home");
  const router = useRouter();

  return (
    <div>
      <section className="bg-gradient-home-hero hero min-h-screen">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <Image
            src="/images/bruce-mars-gJtDg6WfMlQ-unsplash.jpg"
            alt=""
            width={800}
            height={800}
            className="max-w-lg rounded-lg shadow-2xl"
          />

          <div>
            <h1 className="text-6xl font-bold">{t("title")}</h1>
            <p className="py-6">{t("hero-text")}</p>
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-accent btn"
                onClick={() => router.push("/#find-club")}
              >
                {t("btn-visitor")}
              </button>
              <button
                className="btn-primary btn"
                onClick={() => router.push("/manager")}
              >
                {t("btn-manager")}
              </button>
              <button
                className="btn-secondary btn"
                onClick={() => router.push("/#find-coach")}
              >
                {t("btn-coach")}
              </button>
            </div>
          </div>
        </div>
      </section>
      <section id="find-club" className="min-h-[80vh] bg-base-200">
        <div className="container mx-auto">
          <h2>{t("find-club")}</h2>
        </div>
      </section>
      <section id="find-coach" className="min-h-[80vh] bg-base-100">
        <div className="container mx-auto">
          <h2>{t("find-coach")}</h2>
        </div>
      </section>
    </div>
  );
};

export default Home;

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  let destination = "";
  if (session) {
    if (session.user?.role === Role.MEMBER)
      destination = `/member/${session.user.id}`;
    if (session.user?.role === Role.COACH)
      destination = `/coach/${session.user.id}`;
    if (session.user?.role === Role.MANAGER)
      destination = `/manager/${session.user.id}`;
    if (session.user?.role === Role.MANAGER_COACH)
      destination = `/manager-coach/${session.user.id}`;
    if (session.user?.role === Role.ADMIN)
      destination = `/admin/${session.user.id}`;
  }
  return {
    redirect: destination
      ? {
          destination,
          permanent: false,
        }
      : undefined,
    props: {
      session,
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "home"],
        nextI18nConfig
      )),
    },
  };
};
