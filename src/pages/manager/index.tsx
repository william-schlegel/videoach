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
import Pricing from "@ui/pricing";
import { useTranslation } from "next-i18next";
import type { ReactNode } from "react";
import { CgBell, CgOrganisation, CgWebsite } from "react-icons/cg";

function ManagerPage(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const pricingQuery = trpc.pricings.getPricingForRole.useQuery("MANAGER");
  const { data } = pricingQuery;
  const { t } = useTranslation("home");

  function handleSelectPricing(id: string, monthlyPrice: boolean) {
    console.log("{id,monthlyPrice}", { id, monthlyPrice });
  }
  return (
    <div>
      <section className="hero bg-base-100">
        <div className="hero-content py-48 text-center">
          <div className="max-w-md">
            <h1 className="text-5xl font-bold">{t("manager-title")}</h1>
            <p className="py-6 text-lg">{t("manager-text")}</p>
          </div>
        </div>
      </section>
      <section className="bg-base-100">
        <div className="container mx-auto">
          <h2 className="pt-12">{t("features.manager")}</h2>
          <div className="flex justify-center gap-4 py-12">
            <Feature
              title={t("features.management.title")}
              description={t("features.management.description")}
            >
              <CgOrganisation size={64} className="text-accent" />
            </Feature>
            <Feature
              title={t("features.communication.title")}
              description={t("features.communication.description")}
            >
              <CgBell size={64} className="text-accent" />
            </Feature>
            <Feature
              title={t("features.page.title")}
              description={t("features.page.description")}
            >
              <CgWebsite size={64} className="text-accent" />
            </Feature>
          </div>
        </div>
      </section>
      <section className="bg-base-200">
        <div className="container mx-auto">
          <h2 className="py-12">{t("pricing.usage")}</h2>
          <div className="flex gap-4">
            {data?.map((pricing) => (
              <Pricing
                key={pricing.id}
                pricing={pricing}
                onSelect={handleSelectPricing}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

type FeatureProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function Feature({ title, description, children }: FeatureProps) {
  return (
    <div className={`card w-1/4 bg-base-200 shadow-xl`}>
      <figure className="px-10 pt-10">{children}</figure>
      <div className="card-body items-center text-center">
        <h2 className="card-title text-3xl font-bold">{title}</h2>
        {description.split("\n").map((desc, id) => (
          <p key={`p-${id}`}>{desc}</p>
        ))}
      </div>
    </div>
  );
}

export default ManagerPage;

export const getServerSideProps = async ({
  locale,
}: GetServerSidePropsContext) => {
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createContextInner({ session: null }),
    transformer: superjson,
  });

  ssg.pricings.getPricingForRole.prefetch("MANAGER");

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
