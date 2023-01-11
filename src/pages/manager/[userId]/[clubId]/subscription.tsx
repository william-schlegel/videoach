import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import {
  type InferGetServerSidePropsType,
  type GetServerSidePropsContext,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "@auth/[...nextauth]";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@root/src/components/layout";
import {
  CreateSubscription,
  DeleteSubscription,
  UpdateSubscription,
} from "@modals/manageSubscription";

const ManageSubscriptions = ({
  userId,
  clubId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data: sessionData } = useSession();
  const [subscriptionId, setSubscriptionId] = useState("");
  const clubQuery = trpc.clubs.getClubById.useQuery(clubId);
  const siteQuery = trpc.subscriptions.getSubscriptionsForClub.useQuery(
    clubId,
    {
      onSuccess(data) {
        if (subscriptionId === "") setSubscriptionId(data[0]?.id || "");
      },
    }
  );
  const { t } = useTranslation("club");
  const router = useRouter();

  const root = router.asPath.split("/");
  root.pop();
  root.pop();
  const path = root.reduce((a, r) => a.concat(`${r}/`), "");

  if (
    sessionData &&
    ![Role.MANAGER, Role.MANAGER_COACH, Role.ADMIN].includes(
      sessionData.user?.role
    )
  )
    return <div>{t("manager-only")}</div>;

  return (
    <Layout className="container mx-auto">
      <div className="mb-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="flex items-center gap-4">
            {t("subscription.manage-my-subscriptions", {
              count: siteQuery.data?.length ?? 0,
            })}
            <span className="text-secondary">{clubQuery.data?.name}</span>
          </h1>
          <CreateSubscription clubId={clubId} />
        </div>
        <Link className="btn-outline btn-primary btn" href={`${path}clubs`}>
          {t("subscription.back-to-clubs")}
        </Link>
      </div>
      <div className="flex gap-4">
        {siteQuery.isLoading ? (
          <Spinner />
        ) : (
          <ul className="menu w-1/4 overflow-hidden rounded bg-base-100">
            {siteQuery.data?.map((site) => (
              <li key={site.id}>
                <button
                  className={`w-full text-center ${
                    subscriptionId === site.id ? "active" : ""
                  }`}
                  onClick={() => setSubscriptionId(site.id)}
                >
                  {site.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {subscriptionId === "" ? null : (
          <SubscriptionContent
            clubId={clubId}
            subscriptionId={subscriptionId}
          />
        )}
      </div>
    </Layout>
  );
};

export default ManageSubscriptions;

type SubscriptionContentProps = {
  clubId: string;
  subscriptionId: string;
};

export function SubscriptionContent({
  clubId,
  subscriptionId,
}: SubscriptionContentProps) {
  const subQuery =
    trpc.subscriptions.getSubscriptionById.useQuery(subscriptionId);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2>{subQuery.data?.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <UpdateSubscription clubId={clubId} subscriptionId={subscriptionId} />
          <DeleteSubscription clubId={clubId} subscriptionId={subscriptionId} />
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps = async ({
  locale,
  req,
  res,
  params,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (
    session?.user?.role !== Role.MANAGER &&
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
        ["common", "club"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
      clubId: params?.clubId as string,
    },
  };
};
