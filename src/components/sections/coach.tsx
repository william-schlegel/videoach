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
import { useEffect, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import ThemeSelector, { type TThemes } from "../themeSelector";

type CoachCreationProps = {
  userId: string;
  pageId: string;
};

type CoachCreationForm = {
  images?: FileList;
  subtitle: string;
  description: string;
  phone: string;
  email: string;
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

  const querySection = trpc.pages.getSectionByModel.useQuery(
    { pageId, model: "HERO" },
    {
      onSuccess: async (data) => {
        if (!data) return;

        const hc = data?.elements.find((e) => e.elementType === "HERO_CONTENT");
        const cta = data?.elements.find((e) => e.elementType === "BUTTON");
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
          phone: queryCoach.data?.phone ?? "",
          email: queryCoach.data?.email ?? "",
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
      // utils.pages.getSectionByModel.invalidate("HERO");
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
      (e) => e.elementType === "BUTTON"
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
            elementType: "BUTTON",
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
          <label>{t("email")}</label>
          <input
            {...register("email")}
            type="email"
            className="input-bordered input w-full"
          />
          <label>{t("phone")}</label>
          <input
            {...register("phone")}
            type="tel"
            className="input-bordered input w-full"
          />
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
            <button className="btn-primary btn" type="submit">
              {t("save-section")}
            </button>
          </div>
        </form>
      </div>
      <div>
        <div className={`flex flex-col gap-2`}>
          <h3 className="flex items-center justify-between">
            <span>{t("preview")}</span>
            <ThemeSelector onSelect={(t) => setPreviewTheme(t)} />
          </h3>
          <div data-theme={previewTheme} className="py-4">
            <div className="grid grid-cols-2 place-content-center gap-6 p-10">
              <div className="flex justify-end">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    width={300}
                    height={300}
                    alt={sessionData?.user?.name ?? "photo"}
                    className="rounded-md shadow-md"
                  />
                ) : null}
              </div>
              <div className="self-start">
                <p className="text-3xl font-bold">
                  {sessionData?.user?.name ?? ""}
                </p>
                <p className="text-lg font-semibold">{fields.subtitle}</p>
                <p className="text-gray-100">{fields.description}</p>
                {fields.cta && (
                  <button className="btn-primary btn-sm btn w-fit normal-case">
                    {fields.cta}
                  </button>
                )}
              </div>
            </div>
            <div
              className={`grid ${
                fields.withActivities && fields.withCertifications
                  ? "grid-cols-2"
                  : "grid-cols-1"
              } gap-6 px-10`}
            >
              {fields.withCertifications ? (
                <div>
                  <h3>{t("coach-certifications")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {queryCoachData.data?.certifications.map(
                      (certification) => (
                        <div key={certification.id} className="pill">
                          {certification.name}
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : null}
              {fields.withActivities ? (
                <div>
                  <h3>{t("coach-activities")}</h3>
                  <div className="flex flex-wrap gap-2">
                    {queryCoachData.data?.activities.map((activity) => (
                      <div key={activity.id} className="pill">
                        {activity.name}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
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
  return <div>Hero {pageId}</div>;
};
