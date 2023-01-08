/* eslint-disable @next/next/no-img-element */
import { useState, type PropsWithoutRef } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "../../utils/trpc";
import {
  useForm,
  type SubmitHandler,
  type SubmitErrorHandler,
} from "react-hook-form";
import Modal from "@ui/modal";
import SimpleForm from "@ui/simpleform";
import Confirmation from "@ui/confirmation";
import { useTranslation } from "next-i18next";
import { toast } from "react-toastify";
import Image from "next/image";
import CollapsableGroup from "@ui/collapsableGroup";
import Link from "next/link";
import Rating from "@ui/rating";

type ClubFormValues = {
  name: string;
  address: string;
};

type ClubCreateFormValues = {
  isSite: boolean;
} & ClubFormValues;

export const CreateClub = () => {
  const { data: sessionData } = useSession();
  const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClubCreateFormValues>();
  const { t } = useTranslation("club");

  const createClub = trpc.clubs.createClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      toast.success(t("club-created") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<ClubCreateFormValues> = (data) => {
    console.log("data", data);
    createClub.mutate({ userId: sessionData?.user?.id ?? "", ...data });
  };

  const onError: SubmitErrorHandler<ClubCreateFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("create-new-club")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText="Enregistrer"
      errors={errors}
      buttonIcon={<i className="bx bx-plus bx-sm" />}
      onOpenModal={() => reset()}
    >
      <h3>{t("create-new-club")}</h3>
      <p className="py-4">{t("enter-new-club-info")}</p>
      <SimpleForm
        errors={errors}
        register={register}
        fields={[
          {
            label: t("club-name"),
            name: "name",
            required: t("name-mandatory"),
          },
          {
            label: t("club-address"),
            name: "address",
            required: t("address-mandatory"),
          },
          {
            name: "isSite",
            component: (
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-4">
                  <input
                    type="checkbox"
                    className="checkbox-primary checkbox"
                    {...register("isSite")}
                    defaultChecked={true}
                  />
                  <span className="label-text">{t("is-site")}</span>
                </label>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
};

type PropsUpdateDelete = {
  clubId: string;
};

export const UpdateClub = ({ clubId }: PropsWithoutRef<PropsUpdateDelete>) => {
  const { data: sessionData } = useSession();
  const utils = trpc.useContext();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClubFormValues>();
  const { t } = useTranslation("club");
  const queryClub = trpc.clubs.getClubById.useQuery(clubId, {
    onSuccess(data) {
      reset({
        address: data?.address,
        name: data?.name,
      });
    },
  });
  const updateClub = trpc.clubs.updateClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      utils.clubs.getClubById.invalidate(clubId);
      toast.success(t("club-updated") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const onSubmit: SubmitHandler<ClubFormValues> = (data) => {
    updateClub.mutate({ id: clubId, ...data });
  };

  const onError: SubmitErrorHandler<ClubFormValues> = (errors) => {
    console.log("errors", errors);
  };

  return (
    <Modal
      title={t("update-club")}
      handleSubmit={handleSubmit(onSubmit, onError)}
      submitButtonText="Enregistrer"
      errors={errors}
      buttonIcon={<i className="bx bx-edit bx-sm" />}
      variant={"Icon-Outlined-Primary"}
    >
      <h3>
        {t("update-the-club")} {queryClub.data?.name}
      </h3>
      <SimpleForm
        errors={errors}
        register={register}
        isLoading={queryClub.isLoading}
        fields={[
          {
            label: t("club-name"),
            name: "name",
            required: t("name-mandatory"),
          },
          {
            label: t("club-address"),
            name: "address",
            required: t("address-mandatory"),
          },
        ]}
      />
    </Modal>
  );
};

export const DeleteClub = ({ clubId }: PropsWithoutRef<PropsUpdateDelete>) => {
  const utils = trpc.useContext();
  const { data: sessionData } = useSession();
  const { t } = useTranslation("club");

  const deleteClub = trpc.clubs.deleteClub.useMutation({
    onSuccess: () => {
      utils.clubs.getClubsForManager.invalidate(sessionData?.user?.id ?? "");
      utils.clubs.getClubById.invalidate(clubId);
      toast.success(t("club-deleted") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  return (
    <Confirmation
      message={t("club-deletion-message")}
      title={t("club-deletion")}
      onConfirm={() => {
        deleteClub.mutate(clubId);
      }}
      buttonIcon={<i className="bx bx-trash bx-sm" />}
      variant={"Icon-Outlined-Secondary"}
    />
  );
};

export default CreateClub;

export const AddCoachToClub = ({ clubId }: { clubId: string }) => {
  const queryCoachs = trpc.coachs.getAllCoachs.useQuery(undefined, {
    onSuccess(data) {
      if (coachId === "") setCoachId(data?.[0]?.id ?? "");
    },
  });
  const addCoachToClub = trpc.clubs.updateClubCoach.useMutation();
  const [coachId, setCoachId] = useState("");
  const { t } = useTranslation("club");
  const queryCoach = trpc.coachs.getCoachById.useQuery(coachId);
  const photo = trpc.files.getDocumentUrlById.useQuery(
    queryCoach.data?.page?.sections?.[0]?.elements?.[0]?.images?.[0]?.id ?? ""
  );

  const onSubmit = () => {
    if (!coachId) return;
    addCoachToClub.mutate({ id: clubId, coachId });
  };

  return (
    <Modal
      title={t("add-coach")}
      handleSubmit={onSubmit}
      submitButtonText="Enregistrer"
      buttonIcon={<i className="bx bx-plus bx-sm" />}
      variant={"Primary"}
      className="w-11/12 max-w-3xl"
    >
      <h3>{t("find-coach")}</h3>
      <select
        className="w-full"
        value={coachId}
        onChange={(e) => setCoachId(e.target.value)}
      >
        {queryCoachs.data?.map((coach) => (
          <option key={coach.id} value={coach.id}>
            {coach.name}
            {"   ("}
            {coach.email}
            {")"}
          </option>
        ))}
      </select>
      {queryCoach.data ? (
        <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
          <CoachDataPresentation
            url={photo.data?.url ?? null}
            image={queryCoach.data.image ?? "/images/dummy.jpg"}
            activityGroups={queryCoach.data.activityGroups.map((ag) => ({
              id: ag.id,
              name: ag.name,
            }))}
            certifications={queryCoach.data.certifications.map((cert) => ({
              id: cert.id,
              name: cert.name,
              modules: cert.modules.map((mod) => ({
                id: mod.id,
                name: mod.name,
              })),
            }))}
            rating={queryCoach.data.rating}
            id={queryCoach.data.id}
            pageId={queryCoach.data.page?.id}
          />
        </div>
      ) : null}
    </Modal>
  );
};

type IdName = {
  id: string;
  name: string;
};

type CoachDataPresentationProps = {
  url: string | null;
  image: string;
  activityGroups: IdName[];
  certifications: { id: string; name: string; modules: IdName[] }[];
  rating: number;
  id: string;
  pageId?: string;
};

export function CoachDataPresentation({
  url,
  image,
  activityGroups,
  certifications,
  rating,
  id,
  pageId,
}: CoachDataPresentationProps) {
  const { t } = useTranslation("club");
  return (
    <>
      {url ? (
        <Image
          src={url}
          width={300}
          height={300}
          alt=""
          style={{ objectFit: "contain" }}
          className="rounded-md shadow"
        />
      ) : (
        <img
          src={image}
          width={300}
          height={300}
          alt=""
          style={{ objectFit: "contain" }}
          className="rounded-md shadow"
        />
      )}

      <div className="flex flex-col gap-2">
        <label>{t("activities")}</label>
        <div className="flex flex-wrap gap-2">
          {activityGroups.map((ag) => (
            <span key={ag.id} className="pill">
              {ag.name}
            </span>
          ))}
        </div>
        <label>{t("certifications")}</label>
        <div className="flex flex-wrap gap-2">
          {certifications.map((cert) => (
            <CollapsableGroup
              key={cert.id}
              groupName={cert.name}
              className="bg-base-100 normal-case"
            >
              {cert.modules.map((mod) => (
                <span key={mod.id} className="pill pill-xs">
                  {mod.name}
                </span>
              ))}
            </CollapsableGroup>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <label>{t("rating")}</label>
          <Rating note={rating} />
        </div>
        {pageId ? (
          <Link
            href={`/presentation-page/coach/${id}/${pageId}`}
            target="_blank"
            rel="noreferrer"
          >
            <button className="btn btn-primary flex items-center gap-4">
              <span>{t("view-page")}</span>
              <i className="bx bx-link-external bx-xs" />
            </button>
          </Link>
        ) : null}
      </div>
    </>
  );
}
