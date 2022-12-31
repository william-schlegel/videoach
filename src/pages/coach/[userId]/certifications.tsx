import { useSession } from "next-auth/react";
import { useState } from "react";
import { trpc } from "@trpcclient/trpc";
import Spinner from "@ui/spinner";
import {
  type InferGetServerSidePropsType,
  type GetServerSidePropsContext,
} from "next";
import { unstable_getServerSession } from "next-auth";
import { authOptions } from "@auth/[...nextauth]";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { useTranslation } from "next-i18next";
import { Role } from "@prisma/client";
import {
  CreateCertification,
  DeleteCertification,
  UpdateCertification,
} from "@modals/manageCertification";

const ManageCertifications = ({
  userId,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { data: sessionData } = useSession();
  const certificationQuery = trpc.coachs.getCertificationsForCoach.useQuery(
    userId,
    {
      onSuccess(data) {
        if (certificationId === "")
          setCertificationId(data?.certifications[0]?.id || "");
      },
    }
  );
  const [certificationId, setCertificationId] = useState("");
  const { t } = useTranslation("coach");

  if (
    sessionData &&
    ![Role.COACH, Role.MANAGER_COACH, Role.ADMIN].includes(
      sessionData.user?.role
    )
  )
    return <div>{t("coach-only")}</div>;

  return (
    <div className="container mx-auto">
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>
          {t("manage-my-certifications", {
            count: certificationQuery.data?.certifications?.length ?? 0,
          })}
        </h1>
        <CreateCertification userId={userId} />
      </div>
      <div className="flex gap-4">
        {certificationQuery.isLoading ? (
          <Spinner />
        ) : (
          <div className="flex flex-wrap gap-4">
            {certificationQuery.data?.certifications.map((certification) => (
              <div
                key={certification.id}
                className="card w-96 bg-base-100 shadow-xl"
              >
                <div className="card-body">
                  <h2 className="card-title">{certification.name}</h2>
                  <h3>{t("modules")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {certification.modules.map((mod) => (
                      <div key={mod.id} className="pill">
                        {mod.name}
                      </div>
                    ))}
                  </div>
                  <h3>{t("activities")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {certification.activityGroups.map((act) => (
                      <div key={act.id} className="pill">
                        {act.name}
                      </div>
                    ))}
                  </div>
                  <div className="rounded-full bg-primary px-4 py-1 text-center text-primary-content">
                    {certification.documentId
                      ? t("document-ok")
                      : t("document-nok")}
                  </div>
                  <div className="card-actions justify-end">
                    <UpdateCertification
                      userId={userId}
                      certificationId={certification.id}
                    />
                    <DeleteCertification
                      userId={userId}
                      certificationId={certification.id}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCertifications;

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
