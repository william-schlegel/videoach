import { type GetServerSidePropsContext } from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "@auth/[...nextauth]";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { CoachingLevelList, Role } from "@prisma/client";
import Layout from "@root/src/components/layout";
import { useTranslation } from "next-i18next";
import { trpc } from "@trpcclient/trpc";
import { isCUID } from "@lib/checkValidity";
import {
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { formatDateAsYYYYMMDD } from "@lib/formatDate";
import { formatMoney } from "@lib/formatNumber";
import { useState } from "react";
import Spinner from "@ui/spinner";

type OfferProps = {
  userId: string;
};

type OfferFormValues = {
  startDate: Date;
  physical: boolean;
  inHouse: boolean;
  publicPlace: boolean;
  perHourPhysical: number;
  perDayPhysical: number;
  travelFee: number;
  travelLimit: number;
  webcam: boolean;
  perHourWebcam: number;
  perDayWebcam: number;
  freeHours: number;
  levels: CoachingLevelList[];
  packs: TPack[];
};

type TPack = {
  nbHours: number;
  packPrice: number;
};

function Offer({ userId }: OfferProps) {
  const { t } = useTranslation("coach");

  const [pack, setPack] = useState<TPack>({ nbHours: 0, packPrice: 0 });

  const coachData = trpc.coachs.getCoachData.useQuery(userId, {
    enabled: isCUID(userId),
    onSuccess(data) {
      reset({
        inHouse: data?.coachingPrices[0]?.inHouse ?? false,
        physical: data?.coachingPrices[0]?.physical ?? false,
        webcam: data?.coachingPrices[0]?.webcam ?? false,
        publicPlace: data?.coachingPrices[0]?.publicPlace ?? false,
        perHourPhysical: data?.coachingPrices[0]?.perHourPhysical ?? 0,
        perDayPhysical: data?.coachingPrices[0]?.perDayPhysical ?? 0,
        perHourWebcam: data?.coachingPrices[0]?.perHourWebcam ?? 0,
        perDayWebcam: data?.coachingPrices[0]?.perDayWebcam ?? 0,
        travelFee: data?.coachingPrices[0]?.travelFee ?? 0,
        travelLimit: data?.coachingPrices[0]?.travelLimit ?? 0,
        freeHours: data?.coachingPrices[0]?.freeHours ?? 0,
        levels: data?.coachingLevel.map((l) => l.level) ?? [],
        packs: data?.coachingPrices[0]?.packs ?? [],
      });
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    control,
  } = useForm<OfferFormValues>();
  const fields = useWatch({
    control,
    defaultValue: {
      inHouse: false,
      physical: false,
      webcam: false,
      publicPlace: false,
      perHourPhysical: 0,
      perDayPhysical: 0,
      perHourWebcam: 0,
      perDayWebcam: 0,
      travelFee: 0,
      travelLimit: 0,
      freeHours: 0,
      levels: ["ALL"],
    },
  });

  const { getName } = useCoachingLevel();

  const onSubmit: SubmitHandler<OfferFormValues> = (data) => {
    // updateCertification.mutate({ id: certificationId, ...data });
    console.log("data :>> ", data);
  };

  const onError: SubmitErrorHandler<OfferFormValues> = (errors) => {
    console.error("errors", errors);
  };

  function setPackValue(pack: TPack, idx: number) {
    setValue(`packs.${idx}.nbHours`, pack.nbHours);
    setValue(`packs.${idx}.packPrice`, pack.packPrice);
  }

  function handleAddPack() {
    setPackValue(pack, fields.packs?.length ?? 0);
  }

  function handleDeletePack(idx: number) {
    const packs: TPack[] = (
      fields.packs?.filter((_, i) => i !== idx) ?? []
    ).map((p) => ({ nbHours: p.nbHours ?? 0, packPrice: p.packPrice ?? 0 }));
    setValue("packs", packs);
  }

  return (
    <Layout className="container mx-auto">
      <h1>{t("offer.my-offer")}</h1>
      {coachData.isLoading ? (
        <Spinner />
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center gap-4">
            <label className="required">{t("offer.start-date")}</label>
            <div className="flex flex-col gap-2">
              <input
                className="input-bordered input"
                {...register("startDate", {
                  valueAsDate: true,
                  required: t("offer.date-mandatory"),
                })}
                type="date"
                defaultValue={formatDateAsYYYYMMDD()}
              />
              {errors.startDate ? (
                <p className="text-sm text-error">{errors.startDate.message}</p>
              ) : null}
            </div>{" "}
          </div>

          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[2fr_1fr_1fr]">
            <fieldset className="grid grid-cols-2 rounded border border-primary p-4">
              <div>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="checkbox-primary checkbox"
                      {...register("physical")}
                      defaultChecked={false}
                    />
                    <span className="label-text">{t("offer.physical")}</span>
                  </label>
                </div>
                {fields.physical ? (
                  <>
                    <div className="flex gap-2">
                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-2">
                          <input
                            type="checkbox"
                            className="checkbox-primary checkbox"
                            {...register("inHouse")}
                            defaultChecked={false}
                          />
                          <span className="label-text">
                            {t("offer.in-house")}
                          </span>
                        </label>
                      </div>
                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-2">
                          <input
                            type="checkbox"
                            className="checkbox-primary checkbox"
                            {...register("publicPlace")}
                            defaultChecked={false}
                          />
                          <span className="label-text">
                            {t("offer.public-place")}
                          </span>
                        </label>
                      </div>
                    </div>
                    <div className="grid grid-cols-[auto_1fr]">
                      <label>{t("offer.tarif")}</label>
                      <label className="input-group">
                        <input
                          {...register("perHourPhysical", {
                            valueAsNumber: true,
                          })}
                          type={"number"}
                          className="input-bordered input w-full"
                        />
                        <span>{t("offer.per-hour")}</span>
                      </label>
                      <span>&nbsp;</span>
                      <label className="input-group">
                        <input
                          {...register("perDayPhysical", {
                            valueAsNumber: true,
                          })}
                          type={"number"}
                          className="input-bordered input w-full"
                        />
                        <span>{t("offer.per-day")}</span>
                      </label>
                      <label>{t("offer.travel-fee")}</label>
                      <label className="input-group">
                        <input
                          {...register("travelFee", { valueAsNumber: true })}
                          type={"number"}
                          className="input-bordered input w-full"
                        />
                        <span>€</span>
                      </label>

                      <label>{t("offer.travel-limit")}</label>
                      <label className="input-group">
                        <input
                          {...register("travelLimit", { valueAsNumber: true })}
                          type={"number"}
                          className="input-bordered input w-full"
                        />
                        <span>km</span>
                      </label>
                    </div>
                  </>
                ) : null}
              </div>
              <div>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-4">
                    <input
                      type="checkbox"
                      className="checkbox-primary checkbox"
                      {...register("webcam")}
                      defaultChecked={false}
                    />
                    <span className="label-text">{t("offer.webcam")}</span>
                  </label>
                </div>
                {fields.webcam ? (
                  <>
                    <div className="grid grid-cols-[auto_1fr]">
                      <label>{t("offer.tarif")}</label>
                      <label className="input-group">
                        <input
                          {...register("perHourWebcam")}
                          type={"number"}
                          className="input-bordered input w-full"
                        />
                        <span>
                          {t("offer.per-hour", { valueAsNumber: true })}
                        </span>
                      </label>
                      <span>&nbsp;</span>
                      <label className="input-group">
                        <input
                          {...register("perDayWebcam")}
                          type={"number"}
                          className="input-bordered input w-full"
                        />
                        <span>
                          {t("offer.per-day", { valueAsNumber: true })}
                        </span>
                      </label>
                    </div>
                  </>
                ) : null}
              </div>
            </fieldset>
            <fieldset className="flex flex-col rounded border border-primary p-4">
              <label>{t("offer.packs")}</label>
              <table className="table-compact w-full table-auto bg-base-100">
                <thead>
                  <tr>
                    <th>{t("offer.nb-hour")}</th>
                    <th>{t("offer.tarif")}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.packs?.map((pack, idx) => (
                    <tr key={idx} className="text-end">
                      <td>{pack.nbHours}</td>
                      <td>{formatMoney(pack.packPrice)}</td>
                      <td>
                        <i
                          className="bx bx-trash bx-xs cursor-pointer text-red-500"
                          onClick={() => handleDeletePack(idx)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="grid grid-cols-[auto_1fr]">
                <label>{t("offer.nb-hour")}</label>
                <label className="input-group">
                  <input
                    value={pack.nbHours}
                    onChange={(e) =>
                      setPack((p) => ({
                        ...p,
                        nbHours: e.target.valueAsNumber,
                      }))
                    }
                    type={"number"}
                    className="input-bordered input w-full"
                  />
                  <span>h</span>
                </label>
                <label>{t("offer.tarif")}</label>
                <label className="input-group">
                  <input
                    value={pack.packPrice}
                    onChange={(e) =>
                      setPack((p) => ({
                        ...p,
                        packPrice: e.target.valueAsNumber,
                      }))
                    }
                    type={"number"}
                    className="input-bordered input w-full"
                  />
                  <span>€</span>
                </label>
              </div>
              <button
                type="button"
                className="btn-primary btn"
                onClick={() => handleAddPack()}
              >
                {t("offer.add-pack")}
              </button>
            </fieldset>
            <fieldset className="grid grid-cols-2 rounded border border-primary p-4">
              <div className="flex flex-col">
                <label>{t("offer.levels")}</label>
                {COACHING_LEVEL.map((level, idx) => (
                  <label
                    key={level.value}
                    className="label cursor-pointer justify-start gap-4"
                  >
                    <input
                      type="checkbox"
                      className="checkbox-primary checkbox"
                      {...register(`levels.${idx}`)}
                      defaultChecked={false}
                    />
                    <span className="label-text">{getName(level.value)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
          <button type="submit" className="btn-primary btn self-end">
            {t("offer.save")}
          </button>
        </form>
      )}
    </Layout>
  );
}
export default Offer;

const COACHING_LEVEL = [
  { value: CoachingLevelList.ALL, label: "level.all" },
  { value: CoachingLevelList.BEGINNER, label: "level.beginner" },
  { value: CoachingLevelList.INTERMEDIATE, label: "level.intermediate" },
  { value: CoachingLevelList.ADVANCED, label: "level.advanced" },
  { value: CoachingLevelList.EXPERT, label: "level.expert" },
  { value: CoachingLevelList.COMPETITOR, label: "level.competitor" },
  { value: CoachingLevelList.PROFESSIONAL, label: "level.professional" },
] as const;

export function useCoachingLevel() {
  const { t } = useTranslation("coach");
  function getLabel(value?: CoachingLevelList | null) {
    return COACHING_LEVEL.find((d) => d.value === value)?.label ?? "level.all";
  }

  function getName(value?: CoachingLevelList | null) {
    return t(getLabel(value));
  }
  return { getName, getLabel };
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
