import { authOptions } from "@auth/[...nextauth]";
import type { Planning, RoomReservation } from "@prisma/client";
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
import Spinner from "@ui/spinner";
import Layout from "@root/src/components/layout";
import Link from "next/link";
import { toast } from "react-toastify";
import { AddCoachToClub } from "@modals/manageClub";
import { useState } from "react";

function CoachManagementForClub({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation("club");
  const [clubId, setClubId] = useState("");
  const [coachId, setCoachId] = useState("");
  const queryClubs = trpc.clubs.getClubsForManager.useQuery(userId, {
    onSuccess(data) {
      if (clubId === "") setClubId(data[0]?.id ?? "");
    },
  });
  const queryCoachs = trpc.coachs.getCoachsForClub.useQuery(clubId);

  return (
    <Layout className="container mx-auto my-2 flex flex-col gap-2">
      <h1 className="flex items-center">
        {t("common:navigation.coach-management")}
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
          <h4>{t("coachs")}</h4>
          <AddCoachToClub clubId={clubId} />
          <ul className="menu overflow-hidden rounded border border-secondary bg-base-100">
            {queryCoachs.data?.map((coach) => (
              <li key={coach.id}>
                <div className={`flex ${coachId === coach.id ? "active" : ""}`}>
                  <button
                    onClick={() => setCoachId(coach.id)}
                    className="flex flex-1 items-center justify-between"
                  >
                    {coach.name}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        {/*planningId ? (
          <PlanningContent
            clubId={clubId}
            planningId={planningId}
            userId={userId}
          />
        ) : null*/}
      </div>
    </Layout>
  );
}

export default CoachManagementForClub;

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
        ["common", "club", "coach"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
