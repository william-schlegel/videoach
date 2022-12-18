import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { trpc } from "@trpcclient/trpc";
import { CreateClub, DeleteClub, UpdateClub } from "@modals/manageClub";
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
import AddActivity from "@modals/manageActivity";
import Link from "next/link";
import { useRouter } from "next/router";
import { CreateClubCalendar } from "@modals/manageCalendar";
import CalendarWeek from "@root/src/components/calendarWeek";

const ManageClubs = ({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data: sessionData } = useSession();
  const clubQuery = trpc.clubs.getClubsForManager.useQuery(userId, {
    onSuccess(data) {
      if (clubId === "") setClubId(data[0]?.id || "");
    },
  });
  const [clubId, setClubId] = useState("");
  const { t } = useTranslation("club");

  if (
    sessionData &&
    ![Role.MANAGER, Role.MANAGER_COACH, Role.ADMIN].includes(
      sessionData.user?.role
    )
  )
    return <div>{t("manager-only")}</div>;

  return (
    <div className="container mx-auto">
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>{t("manage-my-club", { count: clubQuery.data?.length ?? 0 })}</h1>
        <CreateClub />
      </div>
      <div className="flex gap-4">
        {clubQuery.isLoading ? (
          <Spinner />
        ) : (
          <ul className="menu w-1/4 bg-base-100">
            {clubQuery.data?.map((club) => (
              <li key={club.id}>
                <button
                  className={`w-full text-center ${
                    clubId === club.id ? "active" : ""
                  }`}
                  onClick={() => setClubId(club.id)}
                >
                  {club.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {clubId === "" ? null : (
          <div className="w-full rounded border border-primary p-4">
            <ClubContent userId={userId} clubId={clubId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageClubs;

type ClubContentProps = {
  userId: string;
  clubId: string;
};

export function ClubContent({ userId, clubId }: ClubContentProps) {
  const clubQuery = trpc.clubs.getClubById.useQuery(clubId);
  const calendarQuery = trpc.calendars.getCalendarForClub.useQuery(clubId);
  const utils = trpc.useContext();
  const { t } = useTranslation("club");
  const router = useRouter();

  const root = router.asPath.split("/");
  root.pop();
  const path = root.reduce((a, r) => a.concat(`${r}/`), "");

  if (clubQuery.isLoading) return <Spinner />;
  console.log("calendarQuery", calendarQuery);
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2>{clubQuery.data?.name}</h2>
          <p>({clubQuery.data?.address})</p>
        </div>
        <div className="flex items-center gap-2">
          <UpdateClub clubId={clubId} />
          <DeleteClub clubId={clubId} />
          <CreateClubCalendar clubId={clubId} />
        </div>
      </div>
      <CalendarWeek
        calendar={calendarQuery.data}
        isLoading={calendarQuery.isLoading}
      />
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 rounded border border-primary p-4 ">
          <div className="mb-4 flex flex-row items-center gap-4">
            <h3>{t("site", { count: clubQuery?.data?.sites?.length ?? 0 })}</h3>
            <Link className="btn-secondary btn" href={`${path}${clubId}/sites`}>
              {t("manage-sites")}
            </Link>
          </div>
          {clubQuery?.data?.sites?.map((site) => (
            <div key={site.id} className="my-2 flex items-center gap-4">
              <span>{site.address}</span>
              <div className="rounded-full border border-neutral bg-base-100 px-4 py-2 text-neutral">
                {t("room", { count: site.rooms.length })}
                {site.rooms.length > 0 && (
                  <span className="text-lg text-primary">
                    {site.rooms.length}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 rounded border border-primary p-4 ">
          <div className="mb-4 flex flex-row items-center gap-4">
            <h3>
              {t("activity", {
                count: clubQuery?.data?.activities.length ?? 0,
              })}
            </h3>
            <AddActivity
              clubId={clubId}
              userId={userId}
              onSuccess={() => {
                utils.clubs.getClubById.invalidate(clubId);
              }}
              withAdd
              withUpdate
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {clubQuery?.data?.activities?.map((activity) => (
              <span
                key={activity.id}
                className="rounded-full border border-neutral bg-base-100 px-4 py-2 text-neutral"
              >
                {activity.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
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
        ["common", "club", "calendar"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
