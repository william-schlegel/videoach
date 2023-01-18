import type {
  InferGetServerSidePropsType,
  GetServerSidePropsContext,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "@auth/[...nextauth]";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import Layout from "@root/src/components/layout";
import { useTranslation } from "next-i18next";
import { trpc } from "@trpcclient/trpc";
import { isCUID } from "@lib/checkValidity";
import Spinner from "@ui/spinner";
import { useRouter } from "next/router";
import createLink from "@lib/createLink";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  CreateOffer,
  DeleteOffer,
  UpdateOffer,
  useCoachingTarget,
} from "@modals/manageCoach";
import { Role } from "@prisma/client";
import CoachOfferDisplay from "@sections/coachOffer";

function CoachOffer({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { data: sessionData } = useSession();
  const router = useRouter();
  const offerId = router.query.offerId as string;
  const { t } = useTranslation("coach");
  const { getName } = useCoachingTarget();
  const offerQuery = trpc.coachs.getCoachOffers.useQuery(userId, {
    enabled: isCUID(userId),
    onSuccess(data) {
      if (!offerId) router.push(createLink({ offerId: data[0]?.id }));
    },
  });
  if (
    sessionData &&
    ![Role.COACH, Role.MANAGER_COACH, Role.ADMIN].includes(
      sessionData.user?.role
    )
  )
    return <div>{t("coach-only")}</div>;

  return (
    <Layout className="container mx-auto">
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>{t("offer.my-offer", { count: offerQuery.data?.length ?? 0 })}</h1>
        <CreateOffer userId={sessionData?.user?.id ?? ""} />
      </div>
      <div className="flex gap-4">
        {offerQuery.isLoading ? (
          <Spinner />
        ) : (
          <ul className="menu w-1/4 overflow-hidden rounded bg-base-100">
            {offerQuery.data?.map((offer) => (
              <li key={offer.id}>
                <Link
                  href={createLink({ offerId: offer.id })}
                  className={`flex w-full justify-between ${
                    offerId === offer.id ? "active" : ""
                  }`}
                >
                  <span>{offer.name}</span>
                  <span className="badge-secondary badge">
                    {getName(offer.target)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {offerId === "" ? null : (
          <OfferContent userId={userId} offerId={offerId} />
        )}
      </div>
    </Layout>
  );
}
export default CoachOffer;

type OfferContentProps = {
  userId: string;
  offerId: string;
};

function OfferContent({ userId, offerId }: OfferContentProps) {
  const offerQuery = trpc.coachs.getOfferById.useQuery(offerId, {
    enabled: isCUID(offerId),
  });
  if (offerQuery.isLoading) return <Spinner />;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2>{offerQuery.data?.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <UpdateOffer userId={userId} offerId={offerId} />
          <DeleteOffer userId={userId} offerId={offerId} />
        </div>
      </div>
      <CoachOfferDisplay offerId={offerId} />
    </div>
  );
}

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (
    session?.user?.role !== Role.COACH &&
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
        ["common", "coach"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
