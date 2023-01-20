import { isCUID } from "@lib/checkValidity";
import { formatDateLocalized } from "@lib/formatDate";
import { formatMoney } from "@lib/formatNumber";
import { useCoachingLevel, useCoachingTarget } from "@modals/manageCoach";
import { trpc } from "@trpcclient/trpc";
import Rating from "@ui/rating";
import Spinner from "@ui/spinner";
import { i18n, useTranslation } from "next-i18next";

type Props = { offerId: string };

export function CoachOfferDisplay({ offerId }: Props) {
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
                {offerQuery.data.myPlace ? (
                  <span>{t("offer.my-place")}</span>
                ) : null}
                {offerQuery.data.publicPlace ? (
                  <span>{t("offer.public-place")}</span>
                ) : null}
              </p>
              <p className="flex gap-4">
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

export function CoachOfferPage({ offerId }: Props) {
  const { t } = useTranslation("coach");
  const offerQuery = trpc.coachs.getOfferWithDetails.useQuery(offerId, {
    enabled: isCUID(offerId),
  });
  const { getName: getNameLevel } = useCoachingLevel();
  const listFormatter = new Intl.ListFormat(i18n?.language);

  if (offerQuery.isLoading) return <Spinner />;
  return (
    <div className="container mx-auto flex flex-col-reverse gap-2 px-8 xl:grid xl:grid-cols-[3fr_1fr]">
      <div>
        <section className="flex gap-2">
          {offerQuery.data?.coach?.coachingActivities.map((activity) => (
            <span className="pill" key={activity.id}>
              {activity.name}
            </span>
          ))}
        </section>
        <section>
          <h2>{offerQuery.data?.coach?.description}</h2>
        </section>
        <section>
          <h3>{t("offer.where")}</h3>
          <div className="flex flex-wrap gap-2">
            {offerQuery.data?.physical && offerQuery.data?.myPlace ? (
              <div className="pill w-fit">
                <i className="bx bx-map-pin bx-sm" />
                {t("offer.home", {
                  name: offerQuery.data.coach?.publicName,
                })}
                {" : "}
                {offerQuery.data.coach?.searchAddress}
              </div>
            ) : null}
            {offerQuery.data?.physical && offerQuery.data?.inHouse ? (
              <div className="pill w-fit">
                <i className="bx bx-home bx-sm" />
                <span>{t("offer.your-place")}</span>
                {offerQuery.data.travelLimit ? (
                  <span className="text-sm text-secondary">
                    {t("offer.in-limit", {
                      limit: offerQuery.data.travelLimit,
                      address: offerQuery.data.coach?.searchAddress,
                    })}
                  </span>
                ) : null}
              </div>
            ) : null}
            {offerQuery.data?.physical && offerQuery.data?.publicPlace ? (
              <div className="pill w-fit">
                <i className="bx bx-map-alt bx-sm" />
                <span>{t("offer.public-place")}</span>
                {offerQuery.data.travelLimit ? (
                  <span className="text-sm text-secondary">
                    {t("offer.in-limit", {
                      limit: offerQuery.data.travelLimit,
                      address: offerQuery.data.coach?.user.address,
                    })}
                  </span>
                ) : null}
              </div>
            ) : null}
            {offerQuery.data?.webcam ? (
              <div className="pill w-fit">
                <i className="bx bx-webcam bx-sm" />
                <span>{t("offer.webcam")}</span>
              </div>
            ) : null}
          </div>
        </section>
        <section>
          <h3>{t("offer.course-description")}</h3>
          <div className="pill w-fit">
            <i className="bx bx-rocket bx-sm" />
            {t("offer.levels")}
            {" : "}
            {listFormatter.format(
              offerQuery.data?.coachingLevel?.map((l) =>
                getNameLevel(l.level)
              ) ?? []
            )}
          </div>
          <p className="my-4">{offerQuery.data?.coach?.aboutMe}</p>
        </section>
      </div>
      <div className="card w-full place-self-start bg-base-100 shadow-xl max-xl:card-side">
        <figure
          className="w-[40%] max-w-[16rem] shrink-0 xl:h-64 xl:w-full xl:max-w-full"
          style={{
            backgroundImage: `url(${offerQuery.data?.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="mt-auto h-fit bg-black bg-opacity-20 px-4 py-2 text-accent xl:w-full">
            <h3 className="text-center text-accent">
              {offerQuery.data?.coach?.publicName}
            </h3>
          </div>
        </figure>
        <div className="card-body justify-center">
          <Rating
            note={offerQuery.data?.coach?.rating ?? 5}
            className="justify-center"
          />
          <div className="grid grid-cols-[auto_1fr] items-center gap-x-2">
            <Tarif
              value={offerQuery.data?.perHourPhysical}
              icon="bx-user"
              unit={t("offer.per-hour")}
            />
            <Tarif
              value={offerQuery.data?.perDayPhysical}
              icon="bx-user"
              unit={t("offer.per-day")}
            />
            <Tarif
              value={offerQuery.data?.perHourWebcam}
              icon="bx-webcam"
              unit={t("offer.per-hour")}
            />
            <Tarif
              value={offerQuery.data?.perDayWebcam}
              icon="bx-webcam"
              unit={t("offer.per-day")}
            />
            <Tarif value={offerQuery.data?.travelFee} icon="bx-car" unit="" />
          </div>
        </div>
      </div>
    </div>
  );
}

type TarifProps = { value: number | undefined; icon: string; unit: string };

function Tarif({ value, icon, unit }: TarifProps) {
  if (!value) return null;
  return (
    <>
      <label>
        <i className={`bx ${icon} bx-sm mr-2`} />
      </label>
      <span>
        {formatMoney(value)}
        {unit}
      </span>
    </>
  );
}
