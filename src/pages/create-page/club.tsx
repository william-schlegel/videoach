import { authOptions } from "@auth/[...nextauth]";
import { type PageSectionModel, Role } from "@prisma/client";
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
import {
  CreatePage,
  DeletePage,
  PAGE_SECTION_LIST,
  PAGE_TARGET_LIST,
  UpdatePage,
} from "@modals/managePage";
import Spinner from "@ui/spinner";
import { HeroCreation } from "@root/src/components/sections/hero";

function ClubPage({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { t } = useTranslation("pages");
  const [clubId, setClubId] = useState("");
  const [pageId, setPageId] = useState("");
  const queryClubs = trpc.clubs.getClubsForManager.useQuery(userId, {
    onSuccess(data) {
      setClubId(data[0]?.id ?? "");
    },
  });
  const queryPages = trpc.pages.getPagesForClub.useQuery(clubId, {
    onSuccess(data) {
      if (pageId === "") setPageId(data?.[0]?.id ?? "");
    },
  });

  return (
    <main className="container mx-auto my-2 flex flex-col gap-2">
      <h1 className="flex items-center">
        {t("manage-page")}
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
        <aside className="flex min-w-fit flex-col gap-2">
          <h4>{t("pages")}</h4>
          <CreatePage clubId={clubId} />
          <ul className="menu overflow-hidden rounded border border-secondary bg-base-100">
            {queryPages.data?.map((page) => (
              <li key={page.id}>
                <div className={`flex ${pageId === page.id ? "active" : ""}`}>
                  <button
                    onClick={() => setPageId(page.id)}
                    className="flex flex-1 items-center justify-between"
                  >
                    <span>{page.name}</span>
                    <span className="badge-secondary badge">
                      {t(
                        PAGE_TARGET_LIST.find((t) => t.value === page.target)
                          ?.label ?? ""
                      )}
                    </span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        {pageId ? <PageContent clubId={clubId} pageId={pageId} /> : null}
      </div>
    </main>
  );
}

export default ClubPage;

type PageContentProps = {
  pageId: string;
  clubId: string;
};

const PageContent = ({ pageId, clubId }: PageContentProps) => {
  const queryPage = trpc.pages.getPageById.useQuery(pageId);
  const [section, setSection] = useState<PageSectionModel>(
    PAGE_SECTION_LIST[0]?.value ?? "HERO"
  );
  const { t } = useTranslation("pages");

  if (queryPage.isLoading) return <Spinner />;
  return (
    <article className="flex flex-grow flex-col gap-4">
      <h2 className="flex items-center justify-between">
        {queryPage.data?.name}
        <div className="flex gap-2">
          <UpdatePage clubId={clubId} pageId={pageId} />
          <DeletePage clubId={clubId} pageId={pageId} />
        </div>
      </h2>
      <div className="btn-group">
        {PAGE_SECTION_LIST.map((sec) => (
          <button
            key={sec.value}
            className={`btn btn-primary ${
              sec.value === section ? "" : "btn-outline"
            }`}
            onClick={() => setSection(sec.value)}
          >
            {t(sec.label)}
          </button>
        ))}
      </div>
      <div className="w-full">
        {section === "HERO" && <HeroCreation clubId={clubId} pageId={pageId} />}
      </div>
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
        ["common", "pages"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
