import { authOptions } from "@auth/[...nextauth]";
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
import { CreatePlanning } from "@modals/managePlanning";

function ClubPlanning({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation("planning");
  const [clubId, setClubId] = useState("");
  const [planningId, setPlanningId] = useState("");
  const queryClubs = trpc.clubs.getClubsForManager.useQuery(userId, {
    onSuccess(data) {
      setClubId(data[0]?.id ?? "");
    },
  });
  const queryPlannings = trpc.plannings.getPlanningsForClub.useQuery(clubId, {
    onSuccess(data) {
      if (clubId === "") setClubId(data?.[0]?.id ?? "");
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
        <aside className="flex min-w-fit flex-grow flex-col gap-2">
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
                    <span>{planning.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        {planningId ? (
          <PlanningContent clubId={clubId} planningId={planningId} />
        ) : null}
      </div>
    </Layout>
  );
}

export default ClubPlanning;

type PlanningContentProps = {
  planningId: string;
  clubId: string;
};

const PlanningContent = ({ planningId, clubId }: PlanningContentProps) => {
  return (
    <div>
      {clubId} {planningId}
    </div>
  );
  // const queryPage = trpc.pages.getPageById.useQuery(planningId);
  // const [section, setSection] = useState<PageSectionModel>(
  //   PAGE_SECTION_LIST[0]?.value ?? "HERO"
  // );
  // const { t } = useTranslation("pages");
  // const utils = trpc.useContext();

  // const publishPage = trpc.pages.updatePagePublication.useMutation({
  //   onSuccess(data) {
  //     utils.pages.getPageById.invalidate(planningId);
  //     utils.pages.getPagesForClub.invalidate(clubId);
  //     toast.success(
  //       t(data.published ? "page-published" : "page-unpublished") as string
  //     );
  //   },
  // });

  // if (queryPage.isLoading) return <Spinner />;
  // return (
  //   <article className="flex flex-grow flex-col gap-4">
  //     <h2 className="flex items-center justify-between">
  //       {queryPage.data?.name}
  //       <div className="flex items-center gap-2">
  //         <div className="pill">
  //           <div className="form-control">
  //             <label className="label cursor-pointer gap-4">
  //               <span className="label-text">{t("publish-page")}</span>
  //               <input
  //                 type="checkbox"
  //                 className="checkbox-primary checkbox"
  //                 checked={queryPage.data?.published}
  //                 onChange={(e) =>
  //                   publishPage.mutate({
  //                     planningId,
  //                     published: e.target.checked,
  //                   })
  //                 }
  //               />
  //             </label>
  //           </div>
  //         </div>
  //         <Link
  //           href={`/presentation-page/club/${clubId}/${planningId}`}
  //           target="_blank"
  //           referrerPolicy="no-referrer"
  //           className="btn btn-primary flex gap-2"
  //         >
  //           {t("page-preview")}
  //           <i className="bx bx-link-external bx-xs" />
  //         </Link>

  //         <UpdatePage clubId={clubId} planningId={planningId} />
  //         <DeletePage clubId={clubId} planningId={planningId} />
  //       </div>
  //     </h2>
  //     <div className="btn-group">
  //       {PAGE_SECTION_LIST.map((sec) => (
  //         <button
  //           key={sec.value}
  //           className={`btn btn-primary ${
  //             sec.value === section ? "" : "btn-outline"
  //           }`}
  //           onClick={() => setSection(sec.value)}
  //         >
  //           {t(sec.label)}
  //         </button>
  //       ))}
  //     </div>
  //     <div className="w-full">
  //       {section === "HERO" && <HeroCreation clubId={clubId} planningId={planningId} />}
  //     </div>
  //   </article>
  // );
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
        ["common", "planning"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
