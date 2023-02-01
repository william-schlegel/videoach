import { useRouter } from "next/router";
import { useForm, type SubmitHandler } from "react-hook-form";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { toast } from "react-toastify";
import Layout from "@root/src/components/layout";
import { isCUID } from "@lib/checkValidity";
import { trpc } from "@trpcclient/trpc";

type FormValues = {
  name: string;
  email: string;
  phone: string;
  address: string;
};

export default function Profile() {
  const router = useRouter();
  const { userId } = router.query;
  const myUserId = (Array.isArray(userId) ? userId[0] : userId) || "";

  const userQuery = trpc.users.getUserById.useQuery(myUserId, {
    enabled: isCUID(myUserId),
    onSuccess: (data) => {
      reset({
        name: data?.name ?? "",
        email: data?.email ?? "",
        phone: data?.phone ?? "",
        address: data?.address ?? "",
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();

  const utils = trpc.useContext();
  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess() {
      utils.users.getUserById.invalidate(myUserId);
      toast.success(t("user-updated"));
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const { t } = useTranslation("auth");
  const onSubmit: SubmitHandler<FormValues> = (data) => {
    updateUser.mutate({
      id: myUserId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
    });
  };

  return (
    <Layout
      title={t("your-profile")}
      className="container mx-auto my-2 space-y-2 p-2"
    >
      <h1>{t("your-profile")}</h1>
      <form
        className={`flex flex-col gap-4 xl:grid xl:grid-cols-2 xl:items-start`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <section className={`grid grid-cols-[auto_1fr] gap-2`}>
          <label>{t("change-name")}</label>
          <div>
            <input
              {...register("name", {
                required: t("name-mandatory") ?? true,
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
        </section>
        <button
          className="btn btn-primary col-span-2 w-fit"
          disabled={updateUser.isLoading}
        >
          {t("save-profile")}
        </button>
      </form>
    </Layout>
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
