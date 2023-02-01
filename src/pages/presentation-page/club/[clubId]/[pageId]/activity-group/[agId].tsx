import nextI18nConfig from "@root/next-i18next.config.mjs";
import PageNavigation from "@root/src/pages/create-page/pageNavigation";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { createContextInner } from "@trpcserver/context";
import { appRouter } from "@trpcserver/router/_app";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import superjson from "superjson";
import { ActivityGroupDisplayElement } from "@sections/activities";
import { ActivityDisplayCard } from "@sections/activity";

function ActivityGroup(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  return (
    <div data-theme={props.page.theme ?? "light"}>
      <Head>
        <title>{props.page.clubName}</title>
      </Head>
      <PageNavigation pages={props.page.pages ?? []} />
      <section className="min-h-screen w-full bg-base-200 p-4">
        <ActivityGroupDisplayElement elementId={props.agId} />
        <ActivityDisplayCard pageId={props.pageId} groupId={props.agId} />
      </section>
    </div>
  );
}
export default ActivityGroup;

export const getServerSideProps = async ({
  locale,
  params,
}: GetServerSidePropsContext) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createContextInner({ session: null }),
    transformer: superjson,
  });

  const agId = (params?.agId as string) ?? "";
  ssg.pages.getPageSectionElementById.prefetch(agId);
  const pageId = (params?.pageId as string) ?? "";
  const page = await ssg.pages.getClubPage.fetch(pageId);
  ssg.pages.getPageSectionElements.prefetch({ pageId, section: "ACTIVITIES" });

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["pages"],
        nextI18nConfig
      )),
      agId,
      pageId,
      page,
    },
  };
};
