import { Role } from "@prisma/client";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import { useForm, useWatch, type SubmitHandler } from "react-hook-form";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { Pricing, PricingContainer } from "@ui/pricing";
import { remainingDays } from "@lib/formatDate";
import Confirmation from "@ui/confirmation";
import { toast } from "react-toastify";

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
  role: Role;
};

export default function Profile() {
  const router = useRouter();
  const { userId } = router.query;
  const myUserId = (Array.isArray(userId) ? userId[0] : userId) || "";
  const userQuery = trpc.users.getUserById.useQuery(myUserId, {
    onSuccess: (data) => {
      reset({
        name: data?.name || "",
        email: data?.email || "",
        role: data?.role || Role.MEMBER,
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<FormValues>();
  const role = useWatch({ control, name: "role", defaultValue: "MEMBER" });

  const pricingQuery = trpc.pricings.getPricingForRole.useQuery(role);
  const planUpdate = trpc.users.changeUserPlan.useMutation({
    onSuccess() {
      utils.users.getUserById.invalidate(myUserId);
      toast.success(t("plan-updated") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

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
  const onSubmit: SubmitHandler<FormValues> = (data) =>
    updateUser.mutate({
      id: myUserId,
      ...data,
    });

  return (
    <article className="container mx-auto">
      <h1>{t("your-profile")}</h1>
      <form
        className={`grid grid-cols-[auto_1fr] gap-2`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <label>{t("change-name")}</label>
        <div>
          <input
            {...register("name", {
              required: t("name-mandatory"),
            })}
            type={"text"}
          />
          {errors.name ? (
            <p className="text-sm text-error">{errors.name.message}</p>
          ) : null}
        </div>
        <label>{t("my-email")}</label>
        <input {...register("email")} type={"email"} />
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
        <button className="btn btn-primary" disabled={updateUser.isLoading}>
          {t("save-profile")}
        </button>
      </form>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-2 rounded-md border border-primary p-4">
          <h2>{t("plan")}</h2>
          {userQuery.data?.pricingId &&
          userQuery.data.pricing?.roleTarget === role ? (
            <>
              <label className="self-start">{t("actual-plan")}</label>
              <div className="flex gap-2">
                <div className="rounded bg-primary px-4 py-2 text-primary-content">
                  {userQuery.data.pricing.title}
                </div>
                {userQuery.data.trialUntil ? (
                  <div className="rounded bg-secondary px-4 py-2 text-secondary-content">
                    {t("trial-remaining", {
                      count: remainingDays(userQuery.data.trialUntil),
                    })}
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
          <label className="self-start">{t("select-plan")}</label>
          <PricingContainer compact>
            {pricingQuery.data?.map((pricing) => (
              <Pricing
                key={pricing.id}
                pricingId={pricing.id}
                onSelect={(id, monthly) => {
                  planUpdate.mutate({
                    id: myUserId,
                    monthlyPayment: monthly,
                    pricingId: id,
                  });
                }}
                compact
                forceHighlight={pricing.id === userQuery.data?.pricingId}
              />
            ))}
          </PricingContainer>
          <Confirmation
            message={t("cancel-plan-message")}
            title={t("cancel-plan")}
            variant="Outlined-Secondary"
            buttonIcon={<i className="bx bx-x bx-sm" />}
            textConfirmation={t("cancel-plan-confirm")}
            onConfirm={() =>
              planUpdate.mutate({
                id: myUserId,
                cancelationDate: new Date(Date.now()),
              })
            }
          />
        </div>
        <div className="flex flex-col gap-2 rounded-md border border-primary p-4">
          <h2>{t("payments")}</h2>
        </div>
      </div>
    </article>
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
