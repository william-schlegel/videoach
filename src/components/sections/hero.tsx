/* eslint-disable @next/next/no-img-element */
import { formatSize } from "@lib/formatNumber";
import { useWriteFile } from "@lib/useManageFile";
import { PAGE_SECTION_LIST } from "@modals/managePage";
import { type PageSectionModel } from "@prisma/client";
import { trpc } from "@trpcclient/trpc";
import ButtonIcon from "@ui/buttonIcon";
import Confirmation from "@ui/confirmation";
import Spinner from "@ui/spinner";
import { useTranslation } from "next-i18next";
import { useEffect, useState } from "react";
import type { SubmitHandler } from "react-hook-form";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "react-toastify";
import ThemeSelector, { type TThemes } from "../themeSelector";

type HeroCreationProps = {
  clubId: string;
  pageId: string;
};

type HeroCreationForm = {
  images?: FileList;
  title: string;
  subtitle: string;
  description: string;
  cta: string;
  linkedPage: string;
  pageSection: PageSectionModel;
  protocol: string;
  url: string;
};

const MAX_SIZE = 1024 * 1024;

export const HeroCreation = ({ clubId, pageId }: HeroCreationProps) => {
  const { t } = useTranslation("pages");
  const { register, handleSubmit, getValues, control, setValue, reset } =
    useForm<HeroCreationForm>();
  const [imagePreview, setImagePreview] = useState("");
  const clubQuery = trpc.clubs.getClubById.useQuery(clubId);
  const fields = useWatch({ control });
  const utils = trpc.useContext();
  const [updating, setUpdating] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<TThemes>("cupcake");

  const querySection = trpc.pages.getSectionByModel.useQuery(
    { pageId, model: "HERO" },
    {
      onSuccess: async (data) => {
        if (!data) {
          setUpdating(false);
          return;
        }
        const hc = data?.elements.find((e) => e.elementType === "HERO_CONTENT");
        const cta = data?.elements.find((e) => e.elementType === "BUTTON");
        if (hc?.images?.[0]) {
          const { url } = await utils.files.getDocumentUrlById.fetch(
            hc.images[0].id
          );
          setImagePreview(url);
        }
        const linkUrl = cta?.link
          ? new URL(cta.link)
          : { protocol: "https:", host: "", pathname: "" };
        const resetData: HeroCreationForm = {
          cta: cta?.title ?? "",
          description: hc?.content ?? "",
          linkedPage: cta?.pageId ?? "url",
          pageSection:
            cta?.pageSection ?? PAGE_SECTION_LIST?.[0]?.value ?? "HERO",
          url: `${linkUrl.host}${linkUrl.pathname}` ?? "",
          protocol: linkUrl.protocol,
          title: hc?.title ?? "",
          subtitle: hc?.subTitle ?? "",
        };
        reset(resetData);
        setUpdating(true);
      },
    }
  );
  const queryPages = trpc.pages.getPagesForClub.useQuery(clubId);
  const writeFile = useWriteFile(
    clubQuery.data?.managerId ?? "",
    "PAGE_IMAGE",
    MAX_SIZE
  );
  const createSection = trpc.pages.createPageSection.useMutation({
    onSuccess() {
      toast.success(t("section-created") as string);
      utils.pages.getSectionByModel.invalidate({ pageId, model: "HERO" });
      reset();
      setImagePreview("");
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const deleteSectionElement = trpc.pages.deletePageSectionElement.useMutation({
    onSuccess(data) {
      Promise.all(
        data.images.map((doc) =>
          deleteUserDocument.mutate({ userId: doc.userId, documentId: doc.id })
        )
      );
    },
  });
  const deleteSection = trpc.pages.deletePageSection.useMutation({
    onSuccess(data) {
      Promise.all(
        data.elements.map((elem) => deleteSectionElement.mutateAsync(elem.id))
      );
      toast.success(t("section-deleted") as string);
      utils.pages.getSectionByModel.invalidate({ pageId, model: "HERO" });
      reset();
      setImagePreview("");
    },
    onError(error) {
      toast.error(error.message);
    },
  });

  const createSectionElement =
    trpc.pages.createPageSectionElement.useMutation();
  const updateSectionElement = trpc.pages.updatePageSectionElement.useMutation({
    onSuccess() {
      toast.success(t("section-updated") as string);
      utils.pages.getSectionByModel.invalidate({ pageId, model: "HERO" });
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const deleteUserDocument = trpc.files.deleteUserDocument.useMutation();

  const onSubmit: SubmitHandler<HeroCreationForm> = async (data) => {
    console.log("hero section onSubmit data", data);
    if (updating) {
      const hc = querySection?.data?.elements.find(
        (e) => e.elementType === "HERO_CONTENT"
      );
      const cta = querySection?.data?.elements.find(
        (e) => e.elementType === "BUTTON"
      );
      let docId: string | undefined;
      if (data.images?.[0]) {
        if (hc?.images?.[0])
          await deleteUserDocument.mutateAsync({
            userId: hc.images[0].userId,
            documentId: hc.images[0].id,
          });
        docId = await writeFile(data?.images?.[0]);
      }
      if (hc) {
        await updateSectionElement.mutateAsync({
          id: hc.id,
          title: data.title,
          subTitle: data.subtitle,
          content: data.description,
          images: docId ? [docId] : undefined,
        });
      }
      if (data.cta) {
        if (cta) {
          await updateSectionElement.mutateAsync({
            id: cta.id,
            title: data.cta,
            link:
              data.linkedPage === "url"
                ? `${data.protocol}//${data.url}`
                : undefined,
            pageId: data.linkedPage === "url" ? undefined : data.linkedPage,
            pageSection:
              data.linkedPage === "url" ? undefined : data.pageSection,
          });
        } else {
          if (querySection.data?.id)
            await createSectionElement.mutateAsync({
              elementType: "BUTTON",
              sectionId: querySection.data.id,
              title: data.cta,
              link: data.url ? `${data.protocol}//${data.url}` : undefined,
              pageId: data.linkedPage === "url" ? undefined : data.linkedPage,
              pageSection:
                data.linkedPage === "url" ? undefined : data.pageSection,
            });
        }
      } else if (cta) {
        await deleteSectionElement.mutateAsync(cta.id);
      }
    } else {
      const docId = await writeFile(data.images?.[0]);
      const section = await createSection.mutateAsync({
        model: "HERO",
        pageId,
      });
      await createSectionElement.mutateAsync({
        elementType: "HERO_CONTENT",
        sectionId: section.id,
        title: data.title,
        subTitle: data.subtitle,
        content: data.description,
        images: docId ? [docId] : undefined,
      });
      if (data.cta) {
        await createSectionElement.mutateAsync({
          elementType: "BUTTON",
          sectionId: section.id,
          title: data.cta,
          link: data.url ? `${data.protocol}//${data.url}` : undefined,
          pageId: data.linkedPage === "url" ? undefined : data.linkedPage,
          pageSection: data.linkedPage === "url" ? undefined : data.pageSection,
        });
      }
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

  const handleDeleteSection = () => {
    deleteSection.mutate({ pageId, sectionId: querySection.data?.id ?? "" });
  };

  if (querySection.isLoading) return <Spinner />;

  return (
    <div className="grid w-full grid-cols-2 gap-2">
      <div>
        <h3>{t(updating ? "updating-section" : "creation-section")}</h3>

        <form
          className="grid grid-cols-[auto_1fr] gap-2 rounded border border-primary p-2"
          onSubmit={handleSubmit(onSubmit)}
        >
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
          {imagePreview ? (
            <div className="col-span-2 flex items-center justify-center gap-2">
              <div className="relative w-60 max-w-full">
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
            </div>
          ) : null}
          <label>{t("title")}</label>
          <input
            {...register("title")}
            type="text"
            className="input-bordered input w-full"
          />
          <label>{t("subtitle")}</label>
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
              <label>{t("linked-page")}</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  defaultValue={getValues("linkedPage")}
                  {...register("linkedPage")}
                >
                  {queryPages.data?.map((page) => (
                    <option key={page.id} value={page.id}>
                      {page.name}
                    </option>
                  ))}
                  <option value={"url"}>{t("external-url")}</option>
                </select>
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
              </div>
            </>
          ) : null}
          {fields.linkedPage === "url" ? (
            <>
              <label className="label">
                <span>{t("external-url")}</span>
              </label>
              <label className="input-group">
                <select
                  defaultValue={"https:"}
                  {...register("protocol")}
                  className="w-fit bg-primary text-primary-content"
                >
                  <option value="https:">https://</option>
                  <option value="http:">http://</option>
                </select>
                <input
                  type="text"
                  {...register("url")}
                  className="input-bordered input w-full"
                />
              </label>
            </>
          ) : null}
          <div className="col-span-2 flex justify-between">
            <button className="btn-primary btn" type="submit">
              {t("save-section")}
            </button>
            {updating ? (
              <Confirmation
                title={t("section-deletion")}
                message={t("section-deletion-message")}
                variant={"Icon-Outlined-Secondary"}
                buttonIcon={<i className="bx bx-trash bx-sm" />}
                buttonSize="md"
                textConfirmation={t("section-deletion-confirm")}
                onConfirm={() => handleDeleteSection()}
              />
            ) : null}
          </div>
        </form>
      </div>
      <div className={`flex flex-col gap-2`}>
        <h3 className="flex items-center justify-between">
          <span>{t("preview")}</span>
          <ThemeSelector onSelect={(t) => setPreviewTheme(t)} />
        </h3>
        <div
          data-theme={previewTheme}
          className={`cover flex aspect-[4/3] w-full flex-col items-center justify-center gap-4`}
          style={{
            backgroundImage: `${
              imagePreview ? `url(${imagePreview})` : "unset"
            }`,
            backgroundColor: "rgb(0 0 0 / 0.5)",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundBlendMode: "darken",
          }}
        >
          <p className="text-3xl font-bold text-white">{fields.title}</p>
          <p className="text-lg font-semibold text-white">{fields.subtitle}</p>
          <p className="text-gray-100">{fields.description}</p>
          {fields.cta && (
            <button className="btn-primary btn-sm btn w-fit normal-case">
              {fields.cta}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

type HeroDisplayProps = {
  clubId: string;
  pageId: string;
};

export const HeroDisplay = ({ clubId, pageId }: HeroDisplayProps) => {
  return (
    <div>
      Hero {clubId} {pageId}
    </div>
  );
};
