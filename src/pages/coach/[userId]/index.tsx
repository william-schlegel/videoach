import { authOptions } from "@auth/[...nextauth]";
import { Role } from "@prisma/client";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import {
  type GetServerSidePropsContext,
  type InferGetServerSidePropsType,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import Link from "next/link";
import { toast } from "react-toastify";

const CoachDashboard = ({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const coachQuery = trpc.dashboards.getCoachDataForUserId.useQuery(userId);
  const { t } = useTranslation("dashboard");
  const clubCount = coachQuery.data?.clubs?.length ?? 0;
  const certificationCount = coachQuery.data?.certifications?.length ?? 0;
  const activityCount = coachQuery.data?.activityGroups?.length ?? 0;
  const utils = trpc.useContext();
  const publishPage = trpc.pages.updatePagePublication.useMutation({
    onSuccess(data) {
      utils.dashboards.getCoachDataForUserId.invalidate(userId);
      toast.success(
        t(data.published ? "page-published" : "page-unpublished") as string
      );
    },
  });

  if (coachQuery.isLoading) return <Spinner />;
  const page = coachQuery.data?.page;

  return (
    <main className="container mx-auto my-2 flex flex-col gap-2">
      <h1 className="flex items-center justify-between">
        {t("coach-dashboard")}
        <div className="flex items-center gap-4">
          {page ? (
            <div className="pill">
              <div className="form-control">
                <label className="label cursor-pointer gap-4">
                  <span className="label-text">{t("publish-page")}</span>
                  <input
                    type="checkbox"
                    className="checkbox-primary checkbox"
                    checked={page.published}
                    onChange={(e) =>
                      publishPage.mutate({
                        pageId: page.id,
                        published: e.target.checked,
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ) : null}
          <Link className="btn-secondary btn" href={`${userId}/certifications`}>
            {t("manage-certifications")}
          </Link>
        </div>
      </h1>
      <section className="stats shadow">
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-building bx-lg" />
          </div>
          <div className="stat-title">{t("clubs", { count: clubCount })}</div>
          <div className="stat-value text-primary">{clubCount}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-award bx-lg" />
          </div>
          <div className="stat-title">
            {t("certifications", { count: certificationCount })}
          </div>
          <div className="stat-value text-primary">{certificationCount}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-cycling bx-lg" />
          </div>
          <div className="stat-title">
            {t("activities", { count: activityCount })}
          </div>
          <div className="stat-value text-primary">{activityCount}</div>
        </div>
        <div className="stat">
          <div className="stat-figure text-primary">
            <i className="bx bx-star bx-lg" />
          </div>
          <div className="stat-title">{t("dashboard:rating")}</div>
          <div className="stat-value text-primary">
            {coachQuery.data?.rating?.toFixed(1)}
          </div>
        </div>
      </section>
      <section className="grid grid-cols-2 gap-2">
        <article className="rounded-md border border-primary p-2">
          <h2>{t("planning")}</h2>
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("schedule")}</h2>
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("chat-members")}</h2>
        </article>
        <article className="rounded-md border border-primary p-2">
          <h2>{t("note")}</h2>
        </article>
      </section>
    </main>
  );
};

export default CoachDashboard;

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (session?.user?.role !== Role.COACH && session?.user?.role !== Role.ADMIN)
    return {
      redirect: "/",
      permanent: false,
    };

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "dashboard"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
