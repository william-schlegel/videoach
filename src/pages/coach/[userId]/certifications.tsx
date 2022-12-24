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
import { useRouter } from "next/router";

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
          <ul className="menu w-1/4 overflow-hidden rounded bg-base-100">
            {certificationQuery.data?.certifications?.map((certification) => (
              <li key={certification.id}>
                <button
                  className={`w-full text-center ${
                    certificationId === certification.id ? "active" : ""
                  }`}
                  onClick={() => setCertificationId(certification.id)}
                >
                  {certification.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        {certificationId === "" ? null : (
          <CertificationContent
            userId={userId}
            certificationId={certificationId}
          />
        )}
      </div>
    </div>
  );
};

export default ManageCertifications;

type CertificationContentProps = {
  userId: string;
  certificationId: string;
};

export function CertificationContent({
  userId,
  certificationId,
}: CertificationContentProps) {
  const certificationQuery =
    trpc.coachs.getCertificationById.useQuery(certificationId);
  const { t } = useTranslation("coach");
  const router = useRouter();

  const root = router.asPath.split("/");
  root.pop();
  const path = root.reduce((a, r) => a.concat(`${r}/`), "");

  if (certificationQuery.isLoading) return <Spinner />;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2>{certificationQuery.data?.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <UpdateCertification certificationId={certificationId} />
          <DeleteCertification certificationId={certificationId} />
        </div>
      </div>
    </div>
  );
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
