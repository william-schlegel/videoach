import { authOptions } from "@auth/[...nextauth]";
import { Role } from "@prisma/client";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import { useMemo } from "react";

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

  if (managerQuery.isLoading) return <Spinner />;

  return (
    <main className="container mx-auto my-2 flex flex-col gap-2">
      <h1 className="flex justify-between">
        {t("manager-dashboard")}
        <Link className="btn-secondary btn" href={`${userId}/clubs`}>
          {t("manage-club")}
        </Link>
      </h1>
      <section className="stats shadow">
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-building bx-lg" />
          </div>
          <div className="stat-title">
            {t("clubs", { count: managerQuery.data?.length ?? 0 })}
          </div>
          <div className="stat-value text-primary">
            {managerQuery.data?.length}
          </div>
        </div>
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
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("event")}</h2>
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("chat-members-coachs")}</h2>
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("note")}</h2>
        </article>
      </section>
    </main>
  );
};

export default ManagerClubs;

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
