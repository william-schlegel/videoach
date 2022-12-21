import { Pricing } from "@prisma/client";
import { useTranslation } from "next-i18next";
import { useState } from "react";
import { CgChevronRight } from "react-icons/cg";

type Props = {
  pricing: Pricing;
  onSelect: (id: string, monthly: boolean) => void;
};

function Pricing({ pricing, onSelect }: Props) {
  const [monthlyPrice, setMonthlyPrice] = useState(true);
  const { t } = useTranslation("home");
  return (
    <div
      className={`card w-96 ${
        pricing.highlighted
          ? "bg-secondary text-secondary-content"
          : "bg-base-100"
      } shadow-xl`}
    >
      <div className="card-body items-center text-center">
        <h2 className="card-title text-3xl font-bold">{pricing.title}</h2>
        <p>{pricing.description}</p>
        <ul className="self-start py-8">
          {pricing.options.map((option) => (
            <li key={option} className="flex items-center gap-4">
              <CgChevronRight size={16} className="text-accent" />
              {option}
            </li>
          ))}
        </ul>
        {pricing.free ? (
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
                ? t("pricing.price-monthly", { price: pricing.monthly })
                : t("pricing.price-yearly", { price: pricing.yearly })}
            </p>
          </>
        )}
        <div className="card-actions">
          <button
            className="btn-primary btn-block btn"
            onClick={() => onSelect(pricing.id, monthlyPrice)}
          >
            {t("pricing.select")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
