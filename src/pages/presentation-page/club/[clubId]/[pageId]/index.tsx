import nextI18nConfig from "@root/next-i18next.config.mjs";
import { HeroDisplay } from "@root/src/components/sections/hero";
import PageNavigation from "@root/src/pages/create-page/PageNavigation";
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

function ClubPresentation(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const queryPage = trpc.pages.getClubPage.useQuery(props.pageId);

  return (
    <div data-theme={queryPage.data?.theme ?? "light"}>
      <Head>
        <title>{queryPage.data?.clubName}</title>
      </Head>
      <PageNavigation pages={queryPage.data?.pages ?? []} />
      {queryPage.data?.sections.map((section) =>
        section.model === "HERO" ? (
          <HeroDisplay
            key={section.id}
            clubId={queryPage.data.clubId}
            pageId={props.pageId}
          />
        ) : null
      )}
    </div>
  );
}

export default ClubPresentation;

export const getServerSideProps = async ({
  locale,
  params,
}: GetServerSidePropsContext) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createContextInner({ session: null }),
    transformer: superjson,
  });

  const pageId = (params?.pageId as string) ?? "";
  ssg.pages.getClubPage.prefetch(pageId);

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["pages"],
        nextI18nConfig
      )),
      pageId,
    },
  };
};
