import { authOptions } from "@auth/[...nextauth]";
import { DAYS } from "@modals/manageCalendar";
import type {
  Activity,
  ActivityGroup,
  Club,
  DayName,
  Room,
  Site,
} from "@prisma/client";
import { Role, Subscription } from "@prisma/client";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import Layout from "@root/src/components/layout";
import { trpc } from "@trpcclient/trpc";
import SelectDay from "@ui/selectDay";
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
import { useState } from "react";
import { useDisplaySubscriptionInfo } from "../../manager/[userId]/[clubId]/subscription";

/***
 *
 *  Member dashboard
 *
 */

const MemberDashboard = ({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation("dashboard");
  const queryUser = trpc.users.getUserSubscriptionsById.useQuery(userId);
  const [day, setDay] = useState(DAYS[dayjs().day()]?.value ?? "MONDAY");

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
      <section className="mb-4 grid grid-flow-col gap-4">
        {queryUser.data?.subscriptions.map((sub) => (
          <Subscription key={sub.id} subscription={sub} />
        ))}
      </section>
      <section className="grid grid-cols-2 gap-2">
        <article className="rounded-md border border-primary p-2">
          <div className="flex items-center justify-between">
            <h2>{t("my-planning")}</h2>
            <SelectDay day={day} onNewDay={(newDay) => setDay(newDay)} />
          </div>
          <DailyPlanning day={day} memberId={userId} />
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("my-reservations")}</h2>
        </article>
        <article className="col-span-2 rounded-md border border-primary p-2">
          <h2>{t("my-chat")}</h2>
        </article>
      </section>
    </Layout>
  );
};

export default MemberDashboard;

type DailyPlanningProps = {
  memberId: string;
  day: DayName;
};

function DailyPlanning({ memberId, day }: DailyPlanningProps) {
  const { t } = useTranslation("dashboard");
  const planning = trpc.plannings.getMemberDailyPlanning.useQuery({
    day,
    memberId,
  });
  if (planning.isInitialLoading) return <Spinner />;
  if (!planning.data) return <div>{t("no-planning")}</div>;
  return (
    <div className="flex flex-col gap-2">
      {planning.data.map((plan) => (
        <div
          key={plan.id}
          className="flex flex-col items-center rounded border border-secondary bg-base-100"
        >
          <div className="w-full  bg-secondary text-center text-secondary-content">
            {plan.club.name}
          </div>
          <div className="flex shrink-0 flex-wrap items-start gap-2 p-2">
            {plan.activities.map((activity) => (
              <div key={activity.id} className="border border-base-300 p-2">
                <p>
                  <span className="text-xs">{activity.startTime}</span>
                  {" ("}
                  <span className="text-xs">{activity.duration}</span>
                  {"') "}
                  <span>{activity.activity.name}</span>
                </p>
                <p className="text-xs">
                  <span>{activity.site?.name}</span>
                  {" - "}
                  <span>{activity.room?.name}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type SubscriptionProps = {
  subscription: Subscription & {
    sites: Site[];
    activities: Activity[];
    rooms: Room[];
    activitieGroups: ActivityGroup[];
    club: Club;
  };
};

function Subscription({ subscription }: SubscriptionProps) {
  const { shortInfo, sites, rooms, activityGroups, activities } =
    useDisplaySubscriptionInfo(
      subscription.mode,
      subscription.restriction,
      subscription.activitieGroups.map((ag) => ag.id),
      subscription.activities.map((ag) => ag.id),
      subscription.sites.map((ag) => ag.id),
      subscription.rooms.map((ag) => ag.id)
    );
  return (
    <div className="card w-full max-w-[32rem] bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h3 className="card-title text-primary">{subscription.name}</h3>
          <span className="badge-primary badge">{subscription.club.name}</span>
        </div>
        {shortInfo ? <p>{shortInfo}</p> : ""}
        <div className="flex gap-2">
          <List label="sites" items={sites} />
          <List label="rooms" items={rooms} />
          <List label="activity-groups" items={activityGroups} />
          <List label="activities" items={activities} />
        </div>
      </div>
    </div>
  );
}

type ListProps = {
  label: string;
  items: string[];
};

function List({ label, items }: ListProps) {
  const { t } = useTranslation("dashboard");
  if (!items.length) return null;
  return (
    <div className="flex flex-1 flex-col">
      <h4>{t(label, { count: items.length })}</h4>
      <ul>
        {items.map((item, idx) => (
          <li key={`ITEM-${idx}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

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
        ["common", "dashboard", "club", "calendar"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
