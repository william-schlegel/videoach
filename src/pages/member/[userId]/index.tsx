import { authOptions } from "@auth/[...nextauth]";
import { Role } from "@prisma/client";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import Layout from "@root/src/components/layout";
import { trpc } from "@trpcclient/trpc";
import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";

/***
 *
 *  Member dashboard
 *
 */

const MemberDashboard = ({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation("dashboard");
  const queryUser = trpc.users.getUserById.useQuery(userId);

  return (
    <Layout className="container mx-auto my-2 flex flex-col gap-2">
      <h1 className="flex justify-between">
        {t("member-dashboard")}
        <Link
          className="btn btn-secondary"
          href={`/member/${userId}/subscribe`}
        >
          {t("new-subscription")}
        </Link>
      </h1>
      <h2>
        {t("my-subscription", { count: queryUser.data?.subscriptions.length })}
      </h2>
    </Layout>
  );
};

export default MemberDashboard;

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (session?.user?.role !== Role.MEMBER && session?.user?.role !== Role.ADMIN)
    return {
      redirect: "/signin",
      permanent: false,
    };

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "dashboard"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
