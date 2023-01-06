/* eslint-disable @next/next/no-img-element */
import { formatSize } from "@lib/formatNumber";
import { useWriteFile } from "@lib/useManageFile";
import { PAGE_SECTION_LIST } from "@modals/managePage";
import { type PageSectionModel } from "@prisma/client";
import { trpc } from "@trpcclient/trpc";
import ButtonIcon from "@ui/buttonIcon";
import Spinner from "@ui/spinner";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { Layer, Map as MapComponent, Source } from "react-map-gl";
import { toast } from "react-toastify";
import ThemeSelector, { type TThemes } from "../themeSelector";
import { env } from "@root/src/env/client.mjs";
import turfCircle from "@turf/circle";
import hslToHex from "@lib/hslToHex";
import Head from "next/head";

type CoachCreationProps = {
  userId: string;
  pageId: string;
};

type CoachCreationForm = {
  images?: FileList;
  subtitle: string;
  description: string;
  cta: string;
  pageSection: PageSectionModel;
  withCertifications: boolean;
  withActivities: boolean;
};

const MAX_SIZE = 1024 * 1024;

export const CoachCreation = ({ userId, pageId }: CoachCreationProps) => {
  const { t } = useTranslation("pages");
  const { register, handleSubmit, getValues, control, setValue, reset } =
    useForm<CoachCreationForm>();
  const [imagePreview, setImagePreview] = useState("");
  const queryCoach = trpc.users.getUserById.useQuery(userId);
  const queryCoachData = trpc.pages.getCoachDataForPage.useQuery(userId);
  const fields = useWatch({ control });
  const utils = trpc.useContext();
  const [previewTheme, setPreviewTheme] = useState<TThemes>("cupcake");
  const { data: sessionData } = useSession();
  const updatePageStyle = trpc.pages.updatePageStyleForCoach.useMutation({
    onSuccess() {
      toast.success(t("style-saved") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const querySection = trpc.pages.getPageSection.useQuery(
    { pageId, section: "HERO" },
    {
      onSuccess: async (data) => {
        if (!data) return;

        const hc = data?.elements.find((e) => e.elementType === "HERO_CONTENT");
        const cta = data?.elements.find((e) => e.elementType === "CTA");
        const options = data?.elements.filter(
          (e) => e.elementType === "OPTION"
        );

        if (hc?.images?.[0]) {
          const { url } = await utils.files.getDocumentUrlById.fetch(
            hc.images[0].id
          );
          setImagePreview(url);
        }
        const resetData: CoachCreationForm = {
          cta: cta?.title ?? "",
          description: hc?.content ?? "",
          pageSection: cta?.pageSection ?? "HERO",
          subtitle: hc?.subTitle ?? "",
          withActivities:
            options.find((o) => o.title === "activities")?.optionValue ===
            "yes",
          withCertifications:
            options.find((o) => o.title === "certifications")?.optionValue ===
            "yes",
        };
        reset(resetData);
      },
    }
  );
  const writeFile = useWriteFile(
    queryCoach.data?.id ?? "",
    "PAGE_IMAGE",
    MAX_SIZE
  );
  const deleteSectionElement = trpc.pages.deletePageSectionElement.useMutation({
    onSuccess(data) {
      Promise.all(
        data.images.map((doc) =>
          deleteUserDocument.mutate({ userId: doc.userId, documentId: doc.id })
        )
      );
    },
  });

  const createSectionElement =
    trpc.pages.createPageSectionElement.useMutation();
  const updateSectionElement = trpc.pages.updatePageSectionElement.useMutation({
    onSuccess() {
      toast.success(t("section-updated") as string);
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const deleteUserDocument = trpc.files.deleteUserDocument.useMutation();

  const onSubmit: SubmitHandler<CoachCreationForm> = async (data) => {
    console.log("hero section onSubmit data", data);
    const hc = querySection?.data?.elements.find(
      (e) => e.elementType === "HERO_CONTENT"
    );
    if (!hc || !querySection.data) {
      toast.error("error hc");
      return;
    }
    const cta = querySection?.data?.elements.find(
      (e) => e.elementType === "CTA"
    );
    const optionActivities = querySection?.data?.elements.find(
      (e) => e.elementType === "OPTION" && e.title === "activities"
    );
    const optionCertifications = querySection?.data?.elements.find(
      (e) => e.elementType === "OPTION" && e.title === "certifications"
    );
    let docId: string | undefined;
    if (data.images?.[0]) {
      if (hc?.images?.[0])
        await deleteUserDocument.mutateAsync({
          userId: hc.images[0].userId,
          documentId: hc.images[0].id,
        });
      docId = await writeFile(data.images?.[0]);
    }
    await updateSectionElement.mutateAsync({
      id: hc.id,
      subTitle: data.subtitle,
      content: data.description,
      images: docId ? [docId] : undefined,
    });
    if (optionCertifications?.id) {
      await updateSectionElement.mutateAsync({
        id: optionCertifications.id,
        optionValue: data.withCertifications ? "yes" : "no",
      });
    } else {
      createSectionElement.mutate({
        elementType: "OPTION",
        sectionId: querySection.data.id,
        title: "certifications",
        optionValue: data.withCertifications ? "yes" : "no",
      });
    }
    if (optionActivities?.id) {
      await updateSectionElement.mutateAsync({
        id: optionActivities.id,
        optionValue: data.withActivities ? "yes" : "no",
      });
    } else {
      createSectionElement.mutate({
        elementType: "OPTION",
        sectionId: querySection.data.id,
        title: "activities",
        optionValue: data.withActivities ? "yes" : "no",
      });
    }
    if (data.cta) {
      if (cta) {
        await updateSectionElement.mutateAsync({
          id: cta.id,
          title: data.cta,
          pageSection: data.pageSection,
        });
      } else {
        if (querySection.data?.id)
          await createSectionElement.mutateAsync({
            elementType: "CTA",
            sectionId: querySection.data.id,
            title: data.cta,
            pageSection: data.pageSection,
          });
      }
    } else if (cta) {
      await deleteSectionElement.mutateAsync(cta.id);
    }
  };

  useEffect(() => {
    if (fields.images?.length) {
      const image = fields.images[0];
      if (!image) return;
      if (image.size > MAX_SIZE) {
        toast.error(
          t("image-size-error", { size: formatSize(MAX_SIZE) }) as string
        );
        setValue("images", undefined);
        return;
      }

      const src = URL.createObjectURL(image);
      setImagePreview(src);
    }
  }, [fields.images, t, setValue]);

  const handleDeleteImage = () => {
    setImagePreview("");
    setValue("images", undefined);
  };

  if (querySection.isLoading) return <Spinner />;

  return (
    <div className="grid w-full grid-cols-2 gap-2">
      <div>
        <h3>{t("updating-page")}</h3>
        <form
          className="grid grid-cols-[auto_1fr] gap-2 rounded border border-primary p-2"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="col-span-2 flex items-start gap-4">
            <div className="flex-1">
              <label>{t("image")}</label>
              <input
                type="file"
                className="file-input-bordered file-input-primary file-input w-full"
                {...register("images")}
                accept="image/*"
              />
              <p className="col-span-2 text-sm text-gray-500">
                {t("image-size", { size: formatSize(MAX_SIZE) })}
              </p>
            </div>
            {imagePreview ? (
              <div className="relative w-40 max-w-full">
                <img src={imagePreview} alt="" />
                <button
                  onClick={handleDeleteImage}
                  className="absolute right-2 bottom-2 z-10"
                >
                  <ButtonIcon
                    iconComponent={<i className="bx bx-trash" />}
                    title={t("delete-image")}
                    buttonVariant="Icon-Secondary"
                    buttonSize="sm"
                  />
                </button>
              </div>
            ) : null}
          </div>
          <label>{t("name")}</label>
          <input defaultValue={sessionData?.user?.name ?? ""} disabled />
          <label>{t("info")}</label>
          <input
            {...register("subtitle")}
            type="text"
            className="input-bordered input w-full"
          />
          <label>{t("description")}</label>
          <textarea {...register("description")} rows={4} />
          <label>{t("button-cta")}</label>
          <input
            {...register("cta")}
            type="text"
            className="input-bordered input w-full"
          />
          {fields.cta ? (
            <>
              <label>{t("linked-section")}</label>
              <select
                defaultValue={getValues("pageSection")}
                {...register("pageSection")}
              >
                {PAGE_SECTION_LIST.map((sec) => (
                  <option key={sec.value} value={sec.value}>
                    {t(sec.label)}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <div className="form-control col-span-2">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="checkbox-primary checkbox"
                {...register("withCertifications")}
              />
              <span className="label-text">{t("with-certifications")}</span>
            </label>
          </div>
          <div className="form-control col-span-2">
            <label className="label cursor-pointer justify-start gap-4">
              <input
                type="checkbox"
                className="checkbox-primary checkbox"
                {...register("withActivities")}
              />
              <span className="label-text">{t("with-activities")}</span>
            </label>
          </div>
          <div className="col-span-2 flex justify-between">
            <button className="btn btn-primary" type="submit">
              {t("save-section")}
            </button>
          </div>
        </form>
      </div>
      <div>
        <div className={`flex flex-col gap-2`}>
          <h3 className="flex items-center justify-between">
            <span>{t("preview")}</span>
            <ThemeSelector
              onSelect={(t) => setPreviewTheme(t)}
              onSave={(t) => updatePageStyle.mutate({ userId, pageStyle: t })}
            />
          </h3>
          <div data-theme={previewTheme} className="pt-4">
            <PhotoSection
              imageSrc={imagePreview}
              userName={sessionData?.user?.name}
              info={fields.subtitle}
              description={fields.description}
              email={queryCoach.data?.email}
              phone={queryCoach.data?.phone}
              cta={fields.cta}
              preview
            />
            <CertificationsAndActivities
              withActivities={!!fields.withActivities}
              withCertifications={!!fields.withCertifications}
              certifications={queryCoachData.data?.certifications ?? []}
              activities={queryCoachData.data?.activities ?? []}
              preview
            />
            <MapSection
              longitude={
                queryCoach.data?.searchAddress
                  ? queryCoach.data?.longitude
                  : undefined
              }
              latitude={
                queryCoach.data?.searchAddress
                  ? queryCoach.data?.latitude
                  : undefined
              }
              range={queryCoach.data?.range ?? 10}
              preview
              theme={previewTheme}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

type CoachDisplayProps = {
  pageId: string;
};

export const CoachDisplay = ({ pageId }: CoachDisplayProps) => {
  const queryPage = trpc.pages.getCoachPage.useQuery(pageId);
  const pageData = queryPage.data?.pageData;
  const hero = pageData?.page?.sections
    .find((s) => s.model === "HERO")
    ?.elements.find((e) => e.elementType === "HERO_CONTENT");
  const queryImage = trpc.files.getDocumentUrlById.useQuery(
    hero?.images?.[0]?.id ?? ""
  );

  if (queryPage.isLoading) return <Spinner />;
  if (!queryPage.data) return <div>No page defined for this coach</div>;

  const cta = pageData?.page?.sections
    .find((s) => s.model === "HERO")
    ?.elements.find((e) => e.elementType === "CTA");
  const options = new Map(
    pageData?.page?.sections
      .find((s) => s.model === "HERO")
      ?.elements.filter((e) => e.elementType === "OPTION")
      .map((o) => [o.title, o.optionValue])
  );

  const activities = new Map<string, { id: string; name: string }>();
  if (pageData?.certifications)
    for (const mod of pageData.certifications)
      for (const ag of mod.activityGroups)
        activities.set(ag.id, { id: ag.id, name: ag.name });
  const certifications =
    pageData?.certifications.map((c) => ({ id: c.id, name: c.name })) ?? [];
  const ca = { certifications, activities: Array.from(activities.values()) };

  return (
    <div
      data-theme={pageData?.pageStyle ?? "light"}
      className="flex min-h-screen flex-col items-center justify-center"
    >
      <Head>
        <title>{pageData?.name}</title>
      </Head>
      <PhotoSection
        imageSrc={queryImage.data?.url}
        userName={pageData?.name}
        info={hero?.subTitle}
        description={hero?.content}
        email={pageData?.email}
        phone={pageData?.phone}
        cta={cta?.title}
        ctaSection={cta?.pageSection}
      />
      <CertificationsAndActivities
        withActivities={!!options.get("activities")}
        withCertifications={!!options.get("certifications")}
        certifications={ca.certifications}
        activities={ca.activities}
      />
      <MapSection
        longitude={pageData?.searchAddress ? pageData?.longitude : undefined}
        latitude={pageData?.searchAddress ? pageData?.latitude : undefined}
        theme={(pageData?.pageStyle as TThemes) ?? "light"}
        range={pageData?.range ?? 10}
      />
    </div>
  );
};

type PhotoSectionProps = {
  imageSrc?: string | null;
  userName?: string | null;
  phone?: string | null;
  email?: string | null;
  info?: string | null;
  description?: string | null;
  cta?: string | null;
  ctaSection?: string | null;
  preview?: boolean;
};

function PhotoSection({
  imageSrc,
  userName,
  info,
  description,
  cta,
  ctaSection,
  preview = false,
  email,
  phone,
}: PhotoSectionProps) {
  const router = useRouter();
  const { t } = useTranslation("pages");

  return (
    <div
      className={`grid grid-cols-2 place-content-center ${
        preview ? "gap-6" : "gap-16"
      } p-10`}
    >
      <div className="flex justify-end">
        {imageSrc ? (
          <Image
            src={imageSrc}
            width={preview ? 300 : 600}
            height={preview ? 300 : 600}
            alt={userName ?? "photo"}
            className="w-[clamp(300px,40vw,600px)] rounded-md shadow-md"
          />
        ) : null}
      </div>
      <div className="self-start">
        <p
          className={`${
            preview
              ? "text-3xl"
              : "text-[clamp(2rem,5vw,5rem)] leading-[clamp(3rem,7.5vw,7.5rem)]"
          } font-bold`}
        >
          {userName ?? ""}
        </p>
        <p
          className={`${
            preview
              ? "text-lg"
              : "text-[clamp(1.5rem,2.5vw,3rem)] leading-[clamp(2.25rem,3.75vw,4.5rem)]"
          } font-semibold`}
        >
          {info}
        </p>
        <p className="text-neutral-content">{description}</p>
        {email ? (
          <a
            href={`mailto:${email}`}
            target="_blank"
            rel="noreferrer"
            className={`btn btn-primary btn-block my-4 ${
              preview ? "btn-sm" : "btn-lg"
            } gap-4`}
          >
            {t("contact-me-email")}
            <i className={`bx bx-envelope ${preview ? "bx-sm" : "bx-lg"}`} />
          </a>
        ) : null}
        {phone ? (
          <a
            href={`tel:${phone}`}
            target="_blank"
            rel="noreferrer"
            className={`btn-outline btn btn-secondary btn-block my-4 ${
              preview ? "btn-sm" : "btn-lg"
            } gap-4`}
          >
            {t("contact-me-phone")}
            <i className={`bx bx-phone ${preview ? "bx-sm" : "bx-lg"}`} />
          </a>
        ) : null}
        {cta && (
          <button
            className="btn btn-primary btn-sm w-fit normal-case"
            onClick={() => {
              if (ctaSection) router.push(`/#${ctaSection}`);
            }}
          >
            {cta}
          </button>
        )}
      </div>
    </div>
  );
}

type CertificationsAndActivitiesProps = {
  withActivities: boolean;
  withCertifications: boolean;
  certifications: { id: string; name: string }[];
  activities: { id: string; name: string }[];
  preview?: boolean;
};

function CertificationsAndActivities({
  withActivities,
  withCertifications,
  certifications,
  activities,
  preview = false,
}: CertificationsAndActivitiesProps) {
  const { t } = useTranslation("pages");
  return (
    <div
      className={`grid ${
        withActivities && withCertifications ? "grid-cols-2" : "grid-cols-1"
      } ${preview ? "gap-6" : "gap-16"} mx-auto w-fit px-10`}
    >
      {withCertifications ? (
        <div>
          <h3
            className={
              preview
                ? ""
                : "text-[clamp(2rem,3vw,4rem)] leading-[clamp(3.5rem,4.5vw,5.5rem)]"
            }
          >
            {t("coach-certifications")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {certifications.map((certification) => (
              <div key={certification.id} className="pill">
                {certification.name}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      {withActivities ? (
        <div>
          <h3
            className={
              preview
                ? ""
                : "text-[clamp(2rem,3vw,4rem)] leading-[clamp(3.5rem,4.5vw,5.5rem)]"
            }
          >
            {t("coach-activities")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {activities.map((activity) => (
              <div key={activity.id} className="pill">
                {activity.name}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type MapSectionProps = {
  longitude?: number;
  latitude?: number;
  preview?: boolean;
  theme?: TThemes;
  range: number;
};

function MapSection({
  longitude,
  latitude,
  preview = false,
  range,
  theme = "cupcake",
}: MapSectionProps) {
  const { t } = useTranslation("pages");

  if (!longitude || !latitude) return null;

  const center = [longitude, latitude];
  const circle = turfCircle(center, range, {
    steps: 64,
    units: "kilometers",
    properties: {},
  });

  return (
    <div className={`${preview ? "mt-8" : "mt-24"} w-full bg-base-200`}>
      <div className={`mx-auto max-w-4xl ${preview ? "p-8" : "p-24"}`}>
        <h2
          className={`w-full text-center ${
            preview
              ? ""
              : "text-[clamp(2rem,3vw,4rem)] leading-[clamp(3.5rem,4.5vw,5.5rem)]"
          }`}
        >
          {t("where-to-find-me")}
        </h2>
        <div className="col-span-2 w-full border border-primary">
          <MapComponent
            initialViewState={{
              longitude: 2.2944813,
              latitude: 48.8583701,
              zoom: 7,
            }}
            style={{ width: "100%", height: preview ? "20rem" : "50vh" }}
            mapStyle="mapbox://styles/mapbox/streets-v9"
            mapboxAccessToken={env.NEXT_PUBLIC_MAPBOX_TOKEN}
            attributionControl={false}
            longitude={longitude}
            latitude={latitude}
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
    </div>
  );
}
