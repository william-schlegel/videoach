import { authOptions } from "@auth/[...nextauth]";
import { type Pricing, Role } from "@prisma/client";
import { type GetServerSidePropsContext } from "next";
import { unstable_getServerSession } from "next-auth";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { useSession } from "next-auth/react";
import { trpc } from "@trpcclient/trpc";
import { useState } from "react";
import { useTranslation } from "next-i18next";
import Spinner from "@ui/spinner";
import {
  CreatePricing,
  DeletePricing,
  UndeletePricing,
  UpdatePricing,
} from "@modals/managePricing";
import { Pricing as PricingComponent } from "@ui/pricing";
import { getRoleName } from "../user/[userId]";

type GroupedData = {
  name: string;
  items: Pricing[];
};

function PricingManagement() {
  const { data: sessionData } = useSession();
  const pricingQuery = trpc.pricings.getAllPricing.useQuery(undefined, {
    onSuccess(data) {
      if (pricingId === "") setPricingId(data[0]?.id || "");
      const gd = new Map<string, Pricing[]>();
      for (const p of data) {
        const act = gd.get(p.roleTarget) || [];
        act.push(p);

        gd.set(p.roleTarget, act);
      }
      setGroupedData(
        Array.from(gd).map((g) => ({
          name: t(`auth:${getRoleName(g[0] as Role)}`),
          items: g[1],
        }))
      );
    },
  });
  const [groupedData, setGroupedData] = useState<GroupedData[]>([]);
  const [pricingId, setPricingId] = useState("");
  const { t } = useTranslation("admin");

  if (sessionData && sessionData.user?.role !== Role.ADMIN)
    return <div>{t("admin-only")}</div>;

  return (
    <div className="container mx-auto">
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>{t("pricing.manage-my-pricing")}</h1>
        <CreatePricing />
      </div>
      <div className="flex gap-4">
        {pricingQuery.isLoading ? (
          <Spinner />
        ) : (
          <div className="w-1/4 ">
            {groupedData.map((group) => (
              <div key={group.name} className="mb-4 ">
                <h3>{group.name}</h3>
                <ul className="menu overflow-hidden rounded bg-base-100">
                  {group.items.map((pricing) => (
                    <li key={pricing.id}>
                      <button
                        className={`flex w-full items-center justify-between text-center ${
                          pricingId === pricing.id ? "active" : ""
                        }`}
                        onClick={() => setPricingId(pricing.id)}
                      >
                        <span>{pricing.title}</span>
                        {pricing.deleted ? (
                          <i className="bx bx-trash bx-sm text-red-600" />
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
        {pricingId === "" ? null : <PricingContent pricingId={pricingId} />}
      </div>
    </div>
  );
}

export default PricingManagement;

type PricingContentProps = {
  pricingId: string;
};

export function PricingContent({ pricingId }: PricingContentProps) {
  const pricingQuery = trpc.pricings.getPricingById.useQuery(pricingId);
  return (
    <div className="flex w-full flex-col gap-4">
      <PricingComponent pricingId={pricingId} />
      <div className="flex items-center gap-2">
        <UpdatePricing pricingId={pricingId} />

        {pricingQuery.data?.deleted ? (
          <UndeletePricing pricingId={pricingId} />
        ) : (
          <DeletePricing pricingId={pricingId} />
        )}
      </div>
    </div>
  );
}

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (session?.user?.role !== Role.ADMIN)
    return {
      redirect: "/",
      permanent: false,
    };

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "admin", "auth", "home"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
