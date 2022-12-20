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
import { CreateSite, DeleteSite, UpdateSite } from "@modals/manageSite";
import Link from "next/link";
import { useRouter } from "next/router";
import { CreateSiteCalendar } from "@modals/manageCalendar";
import CalendarWeek from "@root/src/components/calendarWeek";
import { CgCalendarDates } from "react-icons/cg";

const ManageSites = ({
  userId,
  clubId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data: sessionData } = useSession();
  const [siteId, setSiteId] = useState("");
  const clubQuery = trpc.clubs.getClubById.useQuery(clubId);
  const siteQuery = trpc.sites.getSitesForClub.useQuery(clubId, {
    onSuccess(data) {
      if (siteId === "") setSiteId(data[0]?.id || "");
    },
  });
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
    <div className="container mx-auto">
      <div className="mb-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="flex items-center gap-4">
            {t("manage-my-sites", { count: siteQuery.data?.length ?? 0 })}
            <span className="text-secondary">{clubQuery.data?.name}</span>
          </h1>
          <CreateSite clubId={clubId} />
        </div>
        <Link className="btn-outline btn-primary btn" href={`${path}clubs`}>
          {t("back-to-clubs")}
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
                    siteId === site.id ? "active" : ""
                  }`}
                  onClick={() => setSiteId(site.id)}
                >
                  {site.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {siteId === "" ? null : (
          <SiteContent userId={userId} clubId={clubId} siteId={siteId} />
        )}
      </div>
    </div>
  );
};

export default ManageSites;

type SiteContentProps = {
  userId: string;
  clubId: string;
  siteId: string;
};

export function SiteContent({ clubId, siteId }: SiteContentProps) {
  const siteQuery = trpc.sites.getSiteById.useQuery(siteId, {
    onSuccess(data) {
      if (!actualRoom && data?.rooms?.length)
        setRoomId(data?.rooms?.[0]?.id ?? "");
    },
  });
  const calendarQuery = trpc.calendars.getCalendarForSite.useQuery({
    siteId,
    clubId,
    openWithClub: siteQuery.data?.openWithClub,
  });

  const { t } = useTranslation("club");
  const router = useRouter();
  const [roomId, setRoomId] = useState("");
  const actualRoom = siteQuery.data?.rooms?.find((r) => r.id === roomId);

  const root = router.asPath.split("/");
  root.pop();
  const path = root.reduce((a, r) => a.concat(`${r}/`), "");

  if (siteQuery.isLoading) return <Spinner />;

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2>{siteQuery.data?.name}</h2>
          <p>({siteQuery.data?.address})</p>
        </div>
        <div className="flex items-center gap-2">
          <UpdateSite clubId={clubId} siteId={siteId} />
          <CreateSiteCalendar siteId={siteId} />
          <DeleteSite clubId={clubId} siteId={siteId} />
        </div>
      </div>
      <CalendarWeek
        calendar={calendarQuery.data}
        isLoading={calendarQuery.isLoading}
      />
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 rounded border border-primary p-4 ">
          <div className="mb-4 flex flex-row items-center justify-between gap-4">
            <h3>{t("room", { count: siteQuery?.data?.rooms?.length ?? 0 })}</h3>
            <Link className="btn-secondary btn" href={`${path}${siteId}/rooms`}>
              {t("manage-rooms")}
            </Link>
          </div>
          <div className="flex gap-4">
            <ul className="menu w-1/4 overflow-hidden rounded bg-base-100">
              {siteQuery?.data?.rooms?.map((room) => (
                <li key={room.id}>
                  <button
                    className={`flex w-full items-center justify-between text-center ${
                      roomId === room.id ? "active" : ""
                    }`}
                    onClick={() => setRoomId(room.id)}
                  >
                    <span>{room.name}</span>
                    {room.reservation !== "NONE" && (
                      <CgCalendarDates size={16} className="text-secondary" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex-1 rounded border border-primary p-4 ">
              Planning des activités
            </div>
            {actualRoom?.reservation !== "NONE" ? (
              <div className="flex-1 rounded border border-primary p-4 ">
                Planning de réservation
              </div>
            ) : null}
          </div>
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
        ["common", "club", "calendar"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
      clubId: params?.clubId as string,
    },
  };
};
