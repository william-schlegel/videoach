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
import { useTranslation } from "next-i18next";
import Layout from "@root/src/components/layout";
import Image from "next/image";
import { isCUID } from "@lib/checkValidity";
import Spinner from "@ui/spinner";
import Link from "next/link";

function OfferPage(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: InferGetServerSidePropsType<typeof getServerSideProps>
) {
  const offerQuery = trpc.coachs.getOfferWithDetails.useQuery(props.offerId, {
    enabled: isCUID(props.offerId),
  });
  const { data } = offerQuery;
  const { t } = useTranslation("home");

  return (
    <Layout>
      <section className="container mx-auto flex flex-wrap gap-8 bg-base-200 py-48">
        {data?.name}
      </section>
    </Layout>
  );
}

export default OfferPage;

function OfferCard({ id }: { id: string }) {
  const { t } = useTranslation("home");
  const offer = trpc.coachs.getOfferWithDetails.useQuery(id, {
    enabled: isCUID(id),
  });

  if (offer.isLoading) return <Spinner />;

  return (
    <div className="card w-96 bg-base-100 shadow-xl">
      <figure>
        <Image
          src={offer.data?.imageUrl ?? "/images/dummy.jpg"}
          alt={offer.data?.coach?.user.name ?? ""}
          width={400}
          height={200}
          className="object-cover object-center"
        />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{offer.data?.name}</h2>
        <p>{offer.data?.description}</p>
        <div className="card-actions justify-end">
          <Link className="btn btn-primary" href={`/company/${id}`}>
            {t("offer-details")}
          </Link>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps = async ({
  locale,
  params,
}: GetServerSidePropsContext) => {
  const offerId = params?.offerId as string;
  const ssg = createProxySSGHelpers({
    router: appRouter,
    ctx: await createContextInner({ session: null }),
    transformer: superjson,
  });

  if (isCUID(offerId)) ssg.coachs.getOfferWithDetails.prefetch(offerId);

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "home"],
        nextI18nConfig
      )),
      trpcState: ssg.dehydrate(),
      offerId,
    },
  };
};
