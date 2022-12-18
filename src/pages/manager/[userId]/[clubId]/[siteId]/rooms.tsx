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
import { CreateSiteCalendar } from "@modals/manageCalendar";
import CalendarWeek from "@root/src/components/calendarWeek";
import { CreateRoom } from "@modals/manageRoom";

const ManageRooms = ({
  clubId,
  siteId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data: sessionData } = useSession();
  const [roomId, setRoomId] = useState("");
  const clubQuery = trpc.clubs.getClubById.useQuery(clubId);
  const siteQuery = trpc.sites.getSiteById.useQuery(siteId);
  const roomQuery = trpc.sites.getRoomsForSite.useQuery(siteId, {
    onSuccess(data) {
      if (roomId === "") setRoomId(data[0]?.id || "");
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
            {t("manage-my-rooms", { count: roomQuery.data?.length ?? 0 })}
            <span className="text-secondary">{siteQuery.data?.name}</span>
          </h1>
          <CreateRoom siteId={siteId} variant={"Primary"} />
        </div>
        <Link className="btn-outline btn-primary btn" href={`${path}sites`}>
          {t("back-to-sites")}
        </Link>
      </div>
      <div className="flex gap-4">
        {roomQuery.isLoading ? (
          <Spinner />
        ) : (
          <ul className="menu w-1/4 bg-base-100">
            {roomQuery.data?.map((room) => (
              <li key={room.id}>
                <button
                  className={`w-full text-center ${
                    roomId === room.id ? "active" : ""
                  }`}
                  onClick={() => setRoomId(room.id)}
                >
                  {room.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {roomId === "" ? null : (
          <div className="w-full rounded border border-primary p-4">&nbsp;</div>
        )}
      </div>
    </div>
  );
};

export default ManageRooms;

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
      siteId: params?.siteId as string,
    },
  };
};
