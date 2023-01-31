import nextI18nConfig from "@root/next-i18next.config.mjs";
import PageNavigation from "@root/src/pages/create-page/pageNavigation";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import { trpc } from "@trpcclient/trpc";
import { createContextInner } from "@trpcserver/context";
import { appRouter } from "@trpcserver/router/_app";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Head from "next/head";
import superjson from "superjson";
import { isCUID } from "@lib/checkValidity";
import { ActivityGroupDisplayElement } from "@sections/activities";

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
      <ActivityGroupDisplayElement elementId={props.agId} />
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
  ssg.pages.getPageSectionElement.prefetch(agId);
  const pageId = (params?.pageId as string) ?? "";
  const page = await ssg.pages.getClubPage.fetch(pageId);

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["pages"],
        nextI18nConfig
      )),
      agId,
      page,
    },
  };
};
