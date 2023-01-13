import { type Pricing, Role, type PricingOption } from "@prisma/client";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { Pricing as PricingCard, PricingContainer } from "@ui/pricing";
import { formatDateAsYYYYMMDD, remainingDays } from "@lib/formatDate";
import Confirmation from "@ui/confirmation";
import { toast } from "react-toastify";
import Layout from "@root/src/components/layout";
import { env } from "@root/src/env/client.mjs";
import AddressSearch from "@ui/addressSearch";
import { Layer, Map as MapComponent, Source } from "react-map-gl";
import turfCircle from "@turf/circle";
import { useMemo, useState } from "react";
import useLocalStorage from "@lib/useLocalstorage";
import { type TThemes } from "@root/src/components/themeSelector";
import hslToHex from "@lib/hslToHex";
import { LATITUDE, LONGITUDE } from "@lib/defaultValues";
import { isCUID } from "@lib/checkValidity";
import Modal from "@ui/modal";
import { formatMoney } from "@lib/formatNumber";

export const ROLE_LIST = [
  { label: "user", value: Role.MEMBER },
  { label: "coach", value: Role.COACH },
  { label: "manager", value: Role.MANAGER },
  { label: "manager-coach", value: Role.MANAGER_COACH },
  { label: "admin", value: Role.ADMIN },
] as const;

export function getRoleName(role: Role) {
  return ROLE_LIST.find((r) => r.value === role)?.label ?? "???";
}

type FormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
  searchAddress: string;
  longitude: number;
  latitude: number;
  role: Role;
  range: number;
};

export default function Profile() {
  const router = useRouter();
  const { userId } = router.query;
  const [theme] = useLocalStorage<TThemes>("theme", "cupcake");
  const myUserId = (Array.isArray(userId) ? userId[0] : userId) || "";
  const [pricingId, setPricingId] = useState<string | undefined>(undefined);
  const [monthlyPayment, setMonthlyPayment] = useState<boolean | undefined>(
    undefined
  );
  const [cancelationDate, setCancelationDate] = useState<string | undefined>(
    undefined
  );

  const userQuery = trpc.users.getUserById.useQuery(myUserId, {
    enabled: isCUID(myUserId),
    onSuccess: (data) => {
      reset({
        name: data?.name || "",
        email: data?.email || "",
        phone: data?.phone || "",
        address: data?.address || "",
        searchAddress: data?.searchAddress || "",
        longitude: data?.longitude || LONGITUDE,
        latitude: data?.latitude || LATITUDE,
        role: data?.role || Role.MEMBER,
        range: data?.range || 10,
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
  } = useForm<FormValues>();
  const fields = useWatch({
    control,
    defaultValue: {
      role: "MEMBER",
    },
  });

  const pricingQuery = trpc.pricings.getPricingForRole.useQuery(
    fields.role ?? "MEMBER"
  );

  const utils = trpc.useContext();
  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess() {
      utils.users.getUserById.invalidate(myUserId);
      toast.success(t("user-updated") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const { t } = useTranslation("auth");
  const onSubmit: SubmitHandler<FormValues> = (data) => {
    updateUser.mutate({
      id: myUserId,
      ...data,
      range: Number(data.range),
      pricingId,
      monthlyPayment,
      cancelationDate: cancelationDate ? new Date(cancelationDate) : undefined,
    });
    setCancelationDate(undefined);
    setMonthlyPayment(undefined);
    setPricingId(undefined);
  };

  const circle = useMemo(() => {
    const center = [fields.longitude ?? LONGITUDE, fields.latitude ?? LATITUDE];
    return turfCircle(center, fields.range ?? 10, {
      steps: 64,
      units: "kilometers",
      properties: {},
    });
  }, [fields.latitude, fields.longitude, fields.range]);

  return (
    <Layout className="container mx-auto">
      <div className="flex items-center justify-between">
        <h1>{t("your-profile")}</h1>
        <Modal
          title={t("payments")}
          buttonIcon={<i className="bx bx-euro bx-sm" />}
          variant="Secondary"
        >
          <h3>{t("payments")}</h3>
        </Modal>
      </div>
      <form
        className={`grid grid-cols-2 items-start gap-2`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className={`grid grid-cols-[auto_1fr]  gap-2`}>
          <label>{t("change-name")}</label>
          <div>
            <input
              {...register("name", {
                required: t("name-mandatory"),
              })}
              type={"text"}
              className="input-bordered input w-full"
            />
            {errors.name ? (
              <p className="text-sm text-error">{errors.name.message}</p>
            ) : null}
          </div>
          <label>{t("my-email")}</label>
          <input
            {...register("email")}
            type={"email"}
            className="input-bordered input w-full"
          />
          <label>{t("phone")}</label>
          <input
            {...register("phone")}
            type="tel"
            className="input-bordered input w-full"
          />
          <label className="place-self-start">{t("address")}</label>
          <textarea {...register("address")} rows={2} />
          <label>{t("account-provider")}</label>
          <div className="flex gap-2">
            {userQuery.data?.accounts.map((account) => (
              <span
                key={account.id}
                className="rounded border border-primary px-4 py-2"
              >
                {account.provider}
              </span>
            ))}
          </div>
          <label>{t("my-role")}</label>
          {userQuery.data?.role === Role.ADMIN ? (
            <div>{t("admin")}</div>
          ) : (
            <select
              className="max-w-xs"
              {...register("role")}
              defaultValue={userQuery.data?.role}
            >
              {ROLE_LIST.filter((rl) => rl.value !== Role.ADMIN).map((rl) => (
                <option key={rl.value} value={rl.value}>
                  {t(rl.label)}
                </option>
              ))}
            </select>
          )}
        </div>
        {fields?.role === "COACH" || fields.role === "MANAGER_COACH" ? (
          <div className={`grid grid-cols-[auto_1fr]  gap-2`}>
            <AddressSearch
              label={t("google-address")}
              defaultAddress={fields.searchAddress ?? ""}
              onSearch={(adr) => {
                setValue("searchAddress", adr.address);
                setValue("latitude", adr.lat);
                setValue("longitude", adr.lng);
              }}
              className="col-span-2"
            />
            <div className="col-span-2 flex justify-between">
              <label>{t("longitude")}</label>
              <input
                {...register("longitude")}
                className="input-bordered input w-full"
                disabled
              />
              <label>{t("latitude")}</label>
              <input
                {...register("latitude")}
                className="input-bordered input w-full"
                disabled
              />
            </div>
            <div className="flex gap-2">
              <label>{t("range")}</label>
              <div className="form-control">
                <div className="input-group">
                  <input
                    type="number"
                    className="input-bordered input"
                    {...register("range")}
                    min={0}
                    max={100}
                  />
                  <span>km</span>
                </div>
              </div>
            </div>
            <div className="col-span-2 border-2 border-primary">
              <MapComponent
                initialViewState={{
                  longitude: LONGITUDE,
                  latitude: LATITUDE,
                  zoom: 8,
                }}
                style={{ width: "100%", height: "20rem" }}
                mapStyle="mapbox://styles/mapbox/streets-v9"
                mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
                attributionControl={false}
                longitude={fields.longitude}
                latitude={fields.latitude}
              >
                <Source type="geojson" data={circle}>
                  <Layer
                    type="fill"
                    paint={{
                      "fill-color": hslToHex(theme, "--p"),
                      "fill-opacity": 0.2,
                    }}
                  />
                  <Layer
                    type="line"
                    paint={{
                      "line-color": hslToHex(theme, "--p"),
                      "line-opacity": 1,
                      "line-width": 2,
                    }}
                  />
                </Source>
              </MapComponent>
            </div>
          </div>
        ) : (
          <div>&nbsp;</div>
        )}

        <section className="col-span-2 flex flex-col gap-2 rounded-md border border-primary p-4">
          <div className="grid grid-cols-[auto_1fr] gap-4">
            <div className="flex flex-col gap-2">
              <h2>{t("plan")}</h2>
              {userQuery.data?.pricingId &&
              userQuery.data.pricing?.roleTarget === fields?.role ? (
                <>
                  <label className="self-start">{t("actual-plan")}</label>
                  <div className="flex gap-2">
                    <div className="rounded bg-primary px-4 py-2 text-primary-content">
                      <PlanDetails
                        monthlyPayment={userQuery.data.monthlyPayment}
                        pricing={userQuery.data.pricing}
                      />
                    </div>
                    {userQuery.data.trialUntil ? (
                      <div className="rounded bg-secondary px-4 py-2 text-secondary-content">
                        {t("trial-remaining", {
                          count: remainingDays(userQuery.data.trialUntil),
                        })}
                      </div>
                    ) : null}
                  </div>
                  <Confirmation
                    message={t("cancel-plan-message")}
                    title={t("cancel-plan")}
                    variant="Outlined-Secondary"
                    buttonIcon={<i className="bx bx-x bx-sm" />}
                    textConfirmation={t("cancel-plan-confirm")}
                    onConfirm={() => setCancelationDate(formatDateAsYYYYMMDD())}
                  />
                </>
              ) : (
                <div>{t("no-plan-yet")}</div>
              )}
              {pricingId ? (
                <div className="flex flex-1 flex-col border-2 border-warning p-2">
                  <h4>{t("new-plan")}</h4>
                  <div className="rounded bg-warning px-4 py-2 text-center text-warning-content">
                    <PlanDetails
                      monthlyPayment={
                        monthlyPayment ?? userQuery.data?.monthlyPayment ?? true
                      }
                      pricing={
                        pricingQuery.data?.find((p) => p.id === pricingId) ??
                        null
                      }
                    />
                  </div>
                </div>
              ) : null}
              {cancelationDate ? (
                <div className="alert alert-warning">
                  <div>
                    <i className="bx bx-error-circle bx-xs" />
                    <span>{t("cancelation-requested")}</span>
                  </div>
                  <div className="flex-none">
                    <button
                      className="btn-outline btn-secondary btn-xs btn"
                      type="button"
                      onClick={() => setCancelationDate(undefined)}
                    >
                      <i className="bx bx-x bx-xs" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
            <div>
              <label className="self-start">{t("select-plan")}</label>
              <PricingContainer compact>
                {pricingQuery.data?.map((pricing) => (
                  <PricingCard
                    key={pricing.id}
                    pricingId={pricing.id}
                    onSelect={(id, monthly) => {
                      setPricingId(id);
                      setMonthlyPayment(monthly);
                    }}
                    compact
                    forceHighlight={pricing.id === userQuery.data?.pricingId}
                  />
                ))}
              </PricingContainer>
            </div>
          </div>
        </section>
        <button
          className="btn-primary btn col-span-2 w-fit"
          disabled={updateUser.isLoading}
        >
          {t("save-profile")}
        </button>
      </form>
    </Layout>
  );
}

type PlanDetailsProps = {
  monthlyPayment: boolean;
  pricing: Pricing | (Pricing & { options: PricingOption[] }) | null;
};

function PlanDetails({ monthlyPayment, pricing }: PlanDetailsProps) {
  const { t } = useTranslation("auth");
  if (!pricing) return null;
  return (
    <>
      {pricing?.title} (
      {monthlyPayment
        ? `${formatMoney(pricing.monthly)} ${t("per-month")}`
        : `${formatMoney(pricing.yearly)} ${t("per-year")}`}
      )
    </>
  );
}

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "auth", "home"],
        nextI18nConfig
      )),
    },
  };
}
