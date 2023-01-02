import {
  PageSectionElementType,
  PageSectionModel,
  PageSectionStyle,
  PageTarget,
} from "@prisma/client";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const PageObject = z.object({
  id: z.string().cuid(),
  name: z.string(),
  clubId: z.string().cuid(),
  target: z.nativeEnum(PageTarget),
});

const PageSectionObject = z.object({
  id: z.string().cuid(),
  model: z.nativeEnum(PageSectionModel),
  style: z.nativeEnum(PageSectionStyle).default("STANDARD"),
  pageId: z.string().cuid(),
});

const PageSectionElementObject = z.object({
  id: z.string().cuid(),
  images: z.array(z.string().cuid()).optional().default([]),
  title: z.string().optional(),
  subTitle: z.string().optional(),
  elementType: z.nativeEnum(PageSectionElementType),
  content: z.string().optional(),
  link: z.string().url().optional(),
  pageId: z.string().cuid().optional(),
  pageSection: z.string().optional(),
  sectionId: z.string().cuid(),
});

export const pageRouter = router({
  getPagesForManager: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.page.findMany({
        where: {
          club: { managerId: input },
        },
        include: {
          club: true,
        },
      });
    }),
  getPagesForClub: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) =>
      ctx.prisma.page.findMany({
        where: { clubId: input },
      })
    ),
  getPageById: protectedProcedure.input(z.string()).query(({ ctx, input }) =>
    ctx.prisma.page.findUnique({
      where: { id: input },
      include: {
        sections: {
          include: {
            elements: {
              include: { images: true },
            },
          },
        },
      },
    })
  ),
  createPage: protectedProcedure
    .input(PageObject.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.page.create({
        data: input,
      })
    ),
  updatePage: protectedProcedure
    .input(PageObject.omit({ clubId: true }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.page.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      })
    ),
  deletePage: protectedProcedure.input(z.string()).mutation(({ ctx, input }) =>
    ctx.prisma.page.delete({
      where: { id: input },
    })
  ),
  getSetionByModel: protectedProcedure
    .input(z.nativeEnum(PageSectionModel))
    .query(({ ctx, input }) =>
      ctx.prisma.pageSection.findFirst({
        where: { model: input },
        include: {
          elements: {
            include: { images: true },
          },
        },
      })
    ),
  createPageSection: protectedProcedure
    .input(PageSectionObject.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.pageSection.create({
        data: {
          model: input.model,
          style: input.style,
          pages: {
            connect: {
              id: input.pageId,
            },
          },
        },
      })
    ),
  updatePageSection: protectedProcedure
    .input(PageSectionObject)
    .mutation(({ ctx, input }) =>
      ctx.prisma.pageSection.update({
        where: { id: input.id },
        data: {
          style: input.style,
        },
      })
    ),
  deletePageSection: protectedProcedure
    .input(
      z.object({ pageId: z.string().cuid(), sectionId: z.string().cuid() })
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.page.update({
        where: {
          id: input.pageId,
        },
        data: {
          sections: {
            disconnect: {
              id: input.sectionId,
            },
          },
        },
      });
      return ctx.prisma.pageSection.delete({
        where: { id: input.sectionId },
        include: {
          elements: true,
        },
      });
    }),
  createPageSectionElement: protectedProcedure
    .input(PageSectionElementObject.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.pageSectionElement.create({
        data: {
          content: input.content,
          elementType: input.elementType,
          images: {
            connect: input.images.map((imageId) => ({ id: imageId })),
          },
          link: input.link,
          pageId: input.pageId,
          pageSection: input.pageSection,
          title: input.title,
          subTitle: input.subTitle,
          sections: {
            connect: { id: input.sectionId },
          },
        },
      })
    ),
  updatePageSectionElement: protectedProcedure
    .input(
      PageSectionElementObject.omit({ sectionId: true, elementType: true })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.pageSectionElement.update({
        where: { id: input.id },
        data: {
          content: input.content,
          images: {
            connect: input.images.map((imageId) => ({ id: imageId })),
          },
          link: input.link,
          pageId: input.pageId,
          pageSection: input.pageSection,
          title: input.title,
          subTitle: input.subTitle,
        },
      })
    ),
  deletePageSectionElement: protectedProcedure
    .input(z.string())
    .mutation(({ ctx, input }) =>
      ctx.prisma.pageSectionElement.delete({
        where: { id: input },
        include: {
          images: true,
        },
      })
    ),
});
