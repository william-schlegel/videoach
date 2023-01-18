import { isCUID } from "@lib/checkValidity";
import { formatDateLocalized } from "@lib/formatDate";
import { formatMoney } from "@lib/formatNumber";
import { useCoachingLevel, useCoachingTarget } from "@modals/manageCoach";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import { i18n, useTranslation } from "next-i18next";

type Props = { offerId: string };
function CoachOffer({ offerId }: Props) {
  const { t } = useTranslation("coach");
  const offerQuery = trpc.coachs.getOfferById.useQuery(offerId, {
    enabled: isCUID(offerId),
  });
  const { getName: getNameTarget } = useCoachingTarget();
  const { getName: getNameLevel } = useCoachingLevel();
  const listFormatter = new Intl.ListFormat(i18n?.language);

  if (offerQuery.isLoading) return <Spinner />;

  const ht =
    offerQuery.data?.target === "COMPANY"
      ? t(
          `offer.${
            offerQuery.data?.excludingTaxes ? "without-tax" : "including-tax"
          }`
        )
      : "";

  return (
    <section className="rounded border border-primary p-4">
      <div className="flex justify-between">
        <div className="flex gap-4">
          <span className="font-semibold text-primary">
            {t("offer.start-date")}
          </span>
          <span>{formatDateLocalized(offerQuery.data?.startDate)}</span>
          <span className="font-semibold text-primary">
            {t("offer.free-hours")}
          </span>
          <span>{offerQuery.data?.freeHours.toFixed(0)} h</span>
        </div>
        <p className="badge-secondary badge">
          {getNameTarget(offerQuery.data?.target)}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="font-semibold text-primary">{t("offer.description")}</p>
          <p>{offerQuery.data?.description} </p>
          <p className="flex gap-4">
            <span className="font-semibold text-primary">
              {t("offer.levels")}
            </span>
            <span>
              {listFormatter.format(
                offerQuery.data?.coachingLevel.map((l) =>
                  getNameLevel(l.level)
                ) ?? []
              )}
            </span>
          </p>
        </div>

        <div>
          {offerQuery.data?.physical ? (
            <>
              <p className="flex gap-4">
                <span className="font-semibold text-primary">
                  {t("offer.physical")}
                </span>
                {offerQuery.data.inHouse ? (
                  <span>{t("offer.in-house")}</span>
                ) : null}
                {offerQuery.data.publicPlace ? (
                  <span>{t("offer.public-place")}</span>
                ) : null}
                <span className="font-semibold text-primary">
                  {t("offer.tarif")}
                </span>
                {offerQuery.data.perHourPhysical ? (
                  <span>
                    {formatMoney(offerQuery.data.perHourPhysical)}
                    {ht}
                    {t("offer.per-hour")}
                  </span>
                ) : null}
                {offerQuery.data.perDayPhysical ? (
                  <span>
                    {formatMoney(offerQuery.data.perDayPhysical)}
                    {ht}
                    {t("offer.per-day")}
                  </span>
                ) : null}
              </p>
              <p className="flex gap-4">
                {offerQuery.data.travelFee ? (
                  <>
                    <span className="font-semibold text-primary">
                      {t("offer.travel-fee")}
                    </span>
                    <span>
                      {formatMoney(offerQuery.data.travelFee)}
                      {ht}
                    </span>
                  </>
                ) : null}
                {offerQuery.data.travelLimit ? (
                  <>
                    <span className="font-semibold text-primary">
                      {t("offer.travel-limit")}
                    </span>
                    <span>{offerQuery.data.travelLimit.toFixed(0)}</span>
                    <span>km</span>
                  </>
                ) : null}
              </p>
            </>
          ) : null}
          {offerQuery.data?.webcam ? (
            <>
              <p className="flex gap-4">
                <span className="font-semibold text-primary">
                  {t("offer.webcam")}
                </span>
                <span className="font-semibold text-primary">
                  {t("offer.tarif")}
                </span>
                {offerQuery.data.perHourWebcam ? (
                  <span>
                    {formatMoney(offerQuery.data.perHourWebcam)}
                    {ht}
                    {t("offer.per-hour")}
                  </span>
                ) : null}
                {offerQuery.data.perDayWebcam ? (
                  <span>
                    {formatMoney(offerQuery.data.perDayWebcam)}
                    {ht}
                    {t("offer.per-day")}
                  </span>
                ) : null}
              </p>
            </>
          ) : null}
          {offerQuery.data?.packs.length ? (
            <div>
              <p className="font-semibold text-primary">{t("offer.packs")}</p>
              {offerQuery.data?.packs.map((pack) => (
                <p key={pack.id} className="flex gap-4">
                  <span>{pack.nbHours}h</span>
                  <span>
                    {formatMoney(pack.packPrice)}
                    {ht}
                  </span>
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
export default CoachOffer;
