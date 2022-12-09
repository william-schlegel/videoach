import { Role } from "@prisma/client";
import { type GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "../../next-i18next.config.mjs";
import { authOptions } from "./api/auth/[...nextauth]";
import { unstable_getServerSession } from "next-auth/next";

const Home = () => {
  return <div>Page de présentation du concept</div>;
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
        ["common"],
        nextI18nConfig
      )),
    },
  };
};
