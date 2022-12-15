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
import {
  CreateSite,
  DeleteSite,
  ManageRooms,
  NewRoom,
  UpdateSite,
} from "@modals/manageSite";
import Link from "next/link";
import { useRouter } from "next/router";
import { CreateSiteCalendar } from "@modals/manageCalendar";

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
          <ul className="menu w-1/4 bg-base-100">
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
          <div className="w-full rounded border border-primary p-4">
            <SiteContent userId={userId} clubId={clubId} siteId={siteId} />
          </div>
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

export function SiteContent({ userId, clubId, siteId }: SiteContentProps) {
  const siteQuery = trpc.sites.getSiteById.useQuery(siteId);
  const utils = trpc.useContext();
  const { t } = useTranslation("club");

  if (siteQuery.isLoading) return <Spinner />;

  return (
    <>
      <div className="flex items-center gap-4">
        <h2>{siteQuery.data?.name}</h2>
        <p>({siteQuery.data?.address})</p>
        <UpdateSite siteId={siteId} />
        <DeleteSite clubId={clubId} siteId={siteId} />
        <CreateSiteCalendar siteId={siteId} />
      </div>
      {/* <div className="flex flex-wrap gap-4">
        <div className="flex-1 rounded border border-primary p-4 ">
          <div className="mb-4 flex flex-row items-center gap-4">
            <h3>{t("site", { count: clubQuery?.data?.sites?.length ?? 0 })}</h3>
            <Link className="btn-secondary btn" href={`${userId}/${clubId}/sites`}>
              {t("manage-sites")}
            </Link>


            <CreateSite clubId={clubId} />
          </div>
          {clubQuery?.data?.sites?.map((site) => (
            <div key={site.id} className="my-2 flex items-center gap-4">
              <UpdateSite clubId={clubId} siteId={site.id} />
              <span>{site.address}</span>
              <div className="rounded-full border border-neutral bg-base-100 px-4 py-2 text-neutral">
                {t("room", { count: site.rooms.length })}
                {site.rooms.length > 0 && (
                  <span className="text-lg text-primary">
                    {site.rooms.length}
                  </span>
                )}
              </div>
              <ManageRooms clubId={clubId} siteId={site.id} />
              <NewRoom clubId={clubId} siteId={site.id} />
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
      </div>*/}
    </>
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
