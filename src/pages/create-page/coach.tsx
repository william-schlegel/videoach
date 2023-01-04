import { authOptions } from "@auth/[...nextauth]";
import { Role } from "@prisma/client";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import Layout from "@root/src/components/layout";
import { CoachCreation } from "@root/src/components/sections/coach";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";

function CoachPage({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation("pages");
  const queryPage = trpc.pages.getPageForCoach.useQuery(userId);

  return (
    <Layout className="container mx-auto my-2 flex flex-col gap-2">
      <h1 className="flex items-center">{t("manage-page")}</h1>
      {queryPage.isLoading ? (
        <Spinner />
      ) : queryPage.data?.id ? (
        <CoachCreation userId={userId} pageId={queryPage.data.id} />
      ) : (
        <div>Error</div>
      )}
    </Layout>
  );
}

export default CoachPage;

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (
    session?.user?.role !== Role.COACH &&
    session?.user?.role !== Role.MANAGER_COACH &&
    session?.user?.role !== Role.ADMIN
  )
    return {
      redirect: "/",
      permanent: false,
    };

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "pages"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
