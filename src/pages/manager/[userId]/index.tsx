import { authOptions } from "@auth/[...nextauth]";
import { DAYS } from "@modals/manageCalendar";
import { Role } from "@prisma/client";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import Layout from "@root/src/components/layout";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import dayjs from "dayjs";
import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import { useMemo } from "react";

/***
 *
 *  Manager dashboard
 *
 */

const ManagerClubs = ({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const managerQuery = trpc.dashboards.getManagerDataForUserId.useQuery(userId);
  const { t } = useTranslation("dashboard");
  const siteCount = useMemo(
    () =>
      managerQuery.data?.reduce(
        (acc, c) => {
          acc.sites += c.sites.length;
          acc.rooms += c.sites.reduce((ss, s) => (ss += s._count.rooms), 0);
          return acc;
        },
        { sites: 0, rooms: 0 }
      ) ?? { sites: 0, rooms: 0 },
    [managerQuery.data]
  );
  const activityCount = useMemo(
    () =>
      managerQuery.data?.reduce((acc, r) => (acc += r.activities.length), 0) ??
      0,
    [managerQuery.data]
  );
  const memberCount = useMemo(
    () =>
      managerQuery.data?.reduce((acc, r) => (acc += r.members.length), 0) ?? 0,
    [managerQuery.data]
  );

  const subscriptionCount = useMemo(
    () =>
      managerQuery.data?.reduce(
        (acc, r) => (acc += r.subscriptions.length),
        0
      ) ?? 0,
    [managerQuery.data]
  );

  if (managerQuery.isLoading) return <Spinner />;

  return (
    <Layout className="container mx-auto my-2 flex flex-col gap-2">
      <h1 className="flex justify-between">
        {t("manager-dashboard")}
        <Link className="btn btn-secondary" href={`${userId}/clubs`}>
          {t("manage-club")}
        </Link>
      </h1>
      <section className="stats shadow">
        <Link className="stat" href={`${userId}/clubs`}>
          <div className="stat-figure text-primary">
            <i className="bx bx-building bx-lg" />
          </div>
          <div className="stat-title">
            {t("clubs", { count: managerQuery.data?.length ?? 0 })}
          </div>
          <div className="stat-value text-primary">
            {managerQuery.data?.length}
          </div>
        </Link>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-map-pin bx-lg" />
          </div>
          <div className="stat-title">
            {t("sites", { count: siteCount.sites })}
          </div>
          <div className="stat-value text-primary">{siteCount.sites}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-home bx-lg" />
          </div>
          <div className="stat-title">
            {t("rooms", { count: siteCount.rooms })}
          </div>
          <div className="stat-value text-primary">{siteCount.rooms}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-cycling bx-lg" />
          </div>
          <div className="stat-title">
            {t("activities", { count: activityCount })}
          </div>
          <div className="stat-value text-primary">{activityCount}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-euro bx-lg" />
          </div>
          <div className="stat-title">
            {t("subscriptions", { count: subscriptionCount })}
          </div>
          <div className="stat-value text-primary">{subscriptionCount}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-user bx-lg" />
          </div>
          <div className="stat-title">
            {t("members", { count: memberCount })}
          </div>
          <div className="stat-value text-primary">{memberCount}</div>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-2">
        <article className="rounded-md border border-primary p-2">
          <h2>{t("planning")}</h2>
          <div className="flex flex-col gap-2">
            {managerQuery.data?.map((club) => (
              <DailyPlanning key={club.id} clubId={club.id} />
            ))}
          </div>
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("event")}</h2>
        </article>
        <article className="col-span-2 rounded-md border border-primary p-2">
          <h2>{t("chat-members-coachs")}</h2>
        </article>
      </section>
    </Layout>
  );
};

export default ManagerClubs;

function DailyPlanning({ clubId }: { clubId: string }) {
  const { t } = useTranslation("dashboard");
  const day = DAYS[dayjs().day()]?.value ?? "MONDAY";
  const planning = trpc.plannings.getClubDailyPlanning.useQuery({
    clubId,
    day,
  });
  if (planning.isInitialLoading) return <Spinner />;
  if (!planning.data) return <div>{t("no-planning")}</div>;
  return (
    <div className="flex flex-col items-center rounded border border-secondary bg-base-100">
      <div className="w-full  bg-secondary text-center text-secondary-content">
        {planning.data?.club?.name}
      </div>
      <div className="flex shrink-0 flex-wrap items-start gap-2 p-2">
        {planning.data.planningActivities.map((activity) => (
          <div key={activity.id} className="border border-base-300 p-2">
            <p>
              <span className="text-xs">{activity.startTime}</span>
              {" ("}
              <span className="text-xs">{activity.duration}</span>
              {"') "}
              <span>{activity.activity.name}</span>
            </p>
            <p className="text-xs">
              <span>{activity.room?.name}</span>
              {" - "}
              <span>{activity.coach?.name}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (
    session?.user?.role !== Role.MANAGER &&
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
        ["common", "dashboard"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
