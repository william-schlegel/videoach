import nextI18nConfig from "@root/next-i18next.config.mjs";
import { HeroDisplay } from "@sections/hero";
import PageNavigation from "@sections/pageNavigation";
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
import { ActivityGroupDisplayCard } from "@sections/activities";
import { isCUID } from "@lib/checkValidity";

function ClubPresentation(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const queryPage = trpc.pages.getClubPage.useQuery(props.pageId, {
    enabled: isCUID(props.pageId),
  });
  const queryClub = trpc.clubs.getClubPagesForNavByClubId.useQuery(
    props.clubId,
    {
      enabled: isCUID(props.clubId),
    }
  );

  return (
    <div data-theme={queryPage.data?.theme ?? "light"}>
      <Head>
        <title>{queryPage.data?.clubName}</title>
      </Head>
      <PageNavigation
        clubId={props.clubId}
        logoUrl={queryClub.data?.logoUrl}
        pages={queryClub.data?.pages ?? []}
      />
      {queryPage.data?.sections.map((section) =>
        section.model === "HERO" ? (
          <HeroDisplay
            key={section.id}
            clubId={queryPage.data.clubId}
            pageId={props.pageId}
          />
        ) : section.model === "ACTIVITY_GROUPS" ? (
          <ActivityGroupDisplayCard key={section.id} pageId={props.pageId} />
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
  const clubId = (params?.clubId as string) ?? "";
  ssg.clubs.getClubPagesForNavByClubId.prefetch(clubId);

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["pages"],
        nextI18nConfig
      )),
      pageId,
      clubId,
    },
  };
};
