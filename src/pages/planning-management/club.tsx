import { authOptions } from "@auth/[...nextauth]";
import type { Planning } from "@prisma/client";
import { Role } from "@prisma/client";
import {
  type InferGetServerSidePropsType,
  type GetServerSidePropsContext,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { trpc } from "@trpcclient/trpc";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import Spinner from "@ui/spinner";
import Layout from "@root/src/components/layout";
import Link from "next/link";
import { toast } from "react-toastify";
import {
  CreatePlanning,
  DeletePlanning,
  UpdatePlanning,
} from "@modals/managePlanning";
import dayjs from "dayjs";
import { formatDateLocalized } from "@lib/formatDate";
import { DAYS } from "@modals/manageCalendar";

function ClubPlanning({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation("planning");
  const [clubId, setClubId] = useState("");
  const [planningId, setPlanningId] = useState("");
  const queryClubs = trpc.clubs.getClubsForManager.useQuery(userId, {
    onSuccess(data) {
      if (clubId === "") setClubId(data[0]?.id ?? "");
    },
  });
  const queryPlannings = trpc.plannings.getPlanningsForClub.useQuery(clubId, {
    onSuccess(data) {
      if (planningId === "") setPlanningId(data[0]?.id ?? "");
    },
  });

  return (
    <Layout className="container mx-auto my-2 flex flex-col gap-2">
      <h1 className="flex items-center">
        {t("planning-management")}
        <div className="ml-auto flex items-center gap-2">
          <label>{t("select-club")}</label>
          <select
            className="w-48 min-w-fit"
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
          >
            {queryClubs.data?.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </div>
      </h1>
      <div className="flex gap-4">
        <aside className="flex min-w-fit max-w-xs flex-grow flex-col gap-2">
          <h4>{t("plannings")}</h4>
          <CreatePlanning clubId={clubId} />
          <ul className="menu overflow-hidden rounded border border-secondary bg-base-100">
            {queryPlannings.data?.map((planning) => (
              <li key={planning.id}>
                <div
                  className={`flex ${
                    planningId === planning.id ? "active" : ""
                  }`}
                >
                  <button
                    onClick={() => setPlanningId(planning.id)}
                    className="flex flex-1 items-center justify-between"
                  >
                    <PlanningName planning={planning} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        {planningId ? (
          <PlanningContent
            clubId={clubId}
            planningId={planningId}
            userId={userId}
          />
        ) : null}
      </div>
    </Layout>
  );
}

export default ClubPlanning;

function PlanningName({ planning }: { planning: Planning }) {
  const { t } = useTranslation("planning");
  return (
    <div className="flex w-full items-center justify-between gap-2">
      {planning.name ? <span>{planning.name}</span> : null}
      <span
        className={`${
          planning.name ? "badge-secondary badge" : ""
        } flex items-center gap-1`}
      >
        {!planning.name && <span>{t("from")}</span>}
        {formatDateLocalized(planning.startDate)}
        {dayjs(planning.endDate).isValid() ? (
          <>
            <i className="bx bx-right-arrow-alt bx-xs" />
            <span>{formatDateLocalized(planning.endDate)}</span>
          </>
        ) : null}
      </span>
    </div>
  );
}

type PlanningContentProps = {
  planningId: string;
  clubId: string;
  userId: string;
};

const PlanningContent = ({
  planningId,
  clubId,
  userId,
}: PlanningContentProps) => {
  const queryPlanning = trpc.plannings.getPlanningById.useQuery(planningId);
  const { t } = useTranslation("planning");
  const queryClub = trpc.clubs.getClubById.useQuery(clubId);
  const queryActivities = trpc.activities.getActivitiesForClub.useQuery({
    clubId,
    userId,
  });

  if (queryPlanning.isLoading) return <Spinner />;
  return (
    <article className="flex flex-grow flex-col gap-4">
      <section className="flex items-center justify-between">
        <h2>
          {queryPlanning.data ? (
            <PlanningName planning={queryPlanning.data} />
          ) : (
            "-"
          )}
        </h2>
        <div className="flex items-center gap-2">
          <UpdatePlanning clubId={clubId} planningId={planningId} />
          <UpdatePlanning clubId={clubId} planningId={planningId} duplicate />
          <DeletePlanning clubId={clubId} planningId={planningId} />
        </div>
      </section>
      <section className="grid grid-cols-[auto_1fr] gap-2">
        <aside className="flex flex-col gap-1 overflow-hidden rounded border border-secondary">
          <span className="bg-secondary px-4 text-center text-secondary-content">
            {t("activities")}
          </span>
          {queryActivities.data?.activities.map((activity) => (
            <span
              key={activity.id}
              className="pill mx-2 justify-center bg-base-100"
            >
              {activity.name}
            </span>
          ))}
        </aside>

        <div className="grid grid-cols-[auto_1fr]">
          <div>
            <div className="h-12"></div>
            <div>
              <div className="flex max-h-[70vh] w-10 shrink-0 flex-col overflow-y-auto border-r border-base-200 bg-base-100 text-center">
                {Array.from({ length: 24 }, (_, k) => k).map((hour) => (
                  <p
                    key={hour}
                    className="h-6 border-b border-base-200 text-xs leading-6 text-base-300"
                  >
                    {`0${hour}`.slice(-2)}:00
                  </p>
                ))}
              </div>
            </div>
          </div>
          <div className="flex max-w-full gap-[1px] overflow-auto">
            {DAYS.map((day) => (
              <div key={day.value} className="shrink-0">
                <div className="w-max-fit flex h-12 flex-shrink-0 flex-col overflow-hidden">
                  <span className="bg-primary text-center text-primary-content">
                    {t(`calendar:${day.label}`)}
                  </span>
                  <div
                    className={`grid gap-[1px]`}
                    style={{
                      gridTemplateColumns: `repeat(${
                        queryClub.data?.sites.length ?? 1
                      }, minmax(0, 1fr)`,
                    }}
                  >
                    {queryClub.data?.sites.map((site) => (
                      <div key={site.id}>
                        <div className="max-w-[8em] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap bg-secondary px-2 text-center text-secondary-content">
                          {site.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div
                  className={`grid gap-x-[1px]`}
                  style={{
                    gridTemplateColumns: `repeat(${
                      queryClub.data?.sites.length ?? 1
                    }, minmax(0, 1fr)`,
                  }}
                >
                  {queryClub.data?.sites.map((site) => (
                    <div key={site.id}>
                      {Array.from({ length: 24 }, (_, k) => k).map((hour) => (
                        <p
                          key={hour}
                          className="h-6 basis-full border-b border-base-200 bg-base-100"
                        ></p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 
        <div className="flex max-w-full flex-col overflow-auto">
          <div className="flex gap-[1px]">
            <div className="w-10 shrink-0"></div>
            {DAYS.map((day) => (
              <div
                key={day.value}
                className="w-max-fit flex flex-shrink-0 flex-col overflow-hidden"
              >
                <span className="bg-primary text-center text-primary-content">
                  {t(`calendar:${day.label}`)}
                </span>
                <div
                  className={`grid gap-[1px]`}
                  style={{
                    gridTemplateColumns: `repeat(${
                      queryClub.data?.sites.length ?? 1
                    }, minmax(0, 1fr)`,
                  }}
                >
                  {queryClub.data?.sites.map((site) => (
                    <div key={site.id}>
                      <div className="max-w-[8em] shrink-0 overflow-hidden text-ellipsis whitespace-nowrap bg-secondary px-2 text-center text-secondary-content">
                        {site.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex">
            <div className="flex max-h-[70vh] w-10 shrink-0 flex-col overflow-y-auto border border-base-200 bg-base-100 text-end">
              {Array.from({ length: 24 }, (_, k) => k).map((hour) => (
                <p
                  key={hour}
                  className="h-6 shrink-0 border-b border-base-200 text-xs text-base-300"
                >
                  {`0${hour}`.slice(-2)}:00
                </p>
              ))}
            </div>

            {DAYS.map((day) => (
              <div
                key={day.value}
                className="flex max-h-[70vh] w-10 shrink-0 flex-col overflow-y-auto border border-base-200 bg-base-100 text-end"
              >
                {Array.from({ length: 24 }, (_, k) => k).map((hour) => (
                  <p
                    key={hour}
                    className="h-6 shrink-0 border-b border-base-200"
                  ></p>
                ))}
              </div>
            ))}
          </div>
        </div> */}
      </section>
    </article>
  );
};

export const getServerSideProps = async ({
  locale,
  req,
  res,
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
        ["common", "planning", "calendar"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
