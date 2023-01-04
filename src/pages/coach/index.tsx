import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
} from "next";
import superjson from "superjson";
import { createContextInner } from "@trpcserver/context";
import { appRouter } from "@trpcserver/router/_app";
import { trpc } from "@trpcclient/trpc";
import { Pricing, PricingContainer } from "@ui/pricing";
import { useTranslation } from "next-i18next";
import { Feature, FeatureContainer } from "@ui/features";
import Link from "next/link";
import Layout from "@root/src/components/layout";

function CoachPage(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const pricingQuery = trpc.pricings.getPricingForRole.useQuery("COACH");
  const { data } = pricingQuery;
  const { t } = useTranslation("home");

  return (
    <Layout>
      <section className="hero bg-base-100">
        <div className="hero-content py-48 text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">{t("coach-title")}</h1>
            <p className="py-6 text-lg">{t("coach-text")}</p>
          </div>
        </div>
      </section>
      <section className="bg-base-100">
        <div className="container mx-auto">
          <h2 className="pt-12">{t("features.coach")}</h2>
          <FeatureContainer>
            <Feature
              title={t("features.coaching.title")}
              description={t("features.coaching.description")}
            >
              <i className="bx bx-user-check bx-lg text-accent" />
            </Feature>
            <Feature
              title={t("features.coach-communication.title")}
              description={t("features.coach-communication.description")}
            >
              <i className="bx bx-bell bx-lg text-accent" />
            </Feature>
            <Feature
              title={t("features.video.title")}
              description={t("features.video.description")}
            >
              <i className="bx bx-video bx-lg text-accent" />
            </Feature>
          </FeatureContainer>
        </div>
      </section>
      <section className="bg-base-200">
        <div className="container mx-auto">
          <h2 className="pt-12">{t("pricing.usage")}</h2>
          <p className="alert alert-info">{t("pricing.try-offer")}</p>
          <PricingContainer>
            {data?.map((pricing) => (
              <Pricing key={pricing.id} pricingId={pricing.id} />
            ))}
          </PricingContainer>
          <Link href="/user/signin">
            <button className="btn btn-accent btn-block my-4">
              {t("pricing.create-your-account")}
            </button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}

export default CoachPage;

export const getServerSideProps = async ({
  locale,
}: GetServerSidePropsContext) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createContextInner({ session: null }),
    transformer: superjson,
  });

  ssg.pricings.getPricingForRole.prefetch("COACH");

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "home"],
        nextI18nConfig
      )),
      trpcState: ssg.dehydrate(),
    },
  };
};
