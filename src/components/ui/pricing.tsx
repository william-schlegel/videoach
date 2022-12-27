import { trpc } from "@trpcclient/trpc";
import { useTranslation } from "next-i18next";
import { type ReactNode, useState } from "react";
import { CgChevronRight } from "react-icons/cg";
import Spinner from "./spinner";

type Props = {
  pricingId: string;
  onSelect?: (id: string, monthly: boolean) => void;
};

export function Pricing({ pricingId, onSelect }: Props) {
  const pricingQuery = trpc.pricings.getPricingById.useQuery(pricingId);
  const [monthlyPrice, setMonthlyPrice] = useState(true);
  const { t } = useTranslation("home");

  if (pricingQuery.isLoading) return <Spinner />;
  return (
    <div
      className={`card w-96 bg-base-100 ${
        pricingQuery.data?.highlighted ? "border-4 border-primary" : ""
      } shadow-xl ${
        pricingQuery.data?.deleted ? "border-4 border-red-600" : ""
      }`}
    >
      <div className="card-body items-center text-center">
        {pricingQuery.data?.deleted ? (
          <div className="alert alert-warning">
            {t("pricing.deleted", {
              date: pricingQuery.data?.deletionDate?.toLocaleDateString(),
            })}
          </div>
        ) : null}
        <h2 className="card-title text-3xl font-bold">
          {pricingQuery.data?.title}
        </h2>
        <p>{pricingQuery.data?.description}</p>
        <ul className="self-start py-8">
          {pricingQuery.data?.options.map((option) => (
            <li key={option.id} className="flex items-center gap-4">
              <CgChevronRight size={16} className="text-accent" />
              {option.name}
            </li>
          ))}
        </ul>
        {pricingQuery.data?.free ? (
          <p className="py-4 text-xl font-bold text-accent">
            {t("pricing.free")}
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                className={`btn-primary btn-sm btn ${
                  monthlyPrice ? "" : "btn-outline"
                }`}
                onClick={() => setMonthlyPrice(true)}
              >
                {t("pricing.monthly")}
              </button>
              <button
                className={`btn-primary btn-sm btn ${
                  monthlyPrice ? "btn-outline" : ""
                }`}
                onClick={() => setMonthlyPrice(false)}
              >
                {t("pricing.yearly")}
              </button>
            </div>
            <p className="py-4 text-xl font-bold text-accent">
              {monthlyPrice
                ? t("pricing.price-monthly", {
                    price: pricingQuery.data?.monthly,
                  })
                : t("pricing.price-yearly", {
                    price: pricingQuery.data?.yearly,
                  })}
            </p>
          </>
        )}
        {typeof onSelect === "function" && (
          <div className="card-actions">
            <button
              className="btn-primary btn-block btn"
              onClick={() =>
                onSelect(pricingQuery.data?.id ?? "", monthlyPrice)
              }
            >
              {t("pricing.select")}
            </button>
          </div>
        )}{" "}
      </div>
    </div>
  );
}

type PricingContainerProps = {
  children: ReactNode;
};

export function PricingContainer({ children }: PricingContainerProps) {
  return (
    <div className="flex flex-wrap items-stretch justify-center py-12">
      {children}
    </div>
  );
}
