import {
  PageSectionElementType,
  PageSectionModel,
  PageTarget,
} from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";

const PageObject = z.object({
  id: z.string().cuid(),
  name: z.string(),
  clubId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  target: z.nativeEnum(PageTarget),
});

const PageSectionObject = z.object({
  id: z.string().cuid(),
  model: z.nativeEnum(PageSectionModel),
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
  pageSection: z.nativeEnum(PageSectionModel).optional(),
  sectionId: z.string().cuid(),
  optionValue: z.string().optional(),
});

type GetCoachDataForPageReturn = {
  certifications: { id: string; name: string }[];
  activities: { id: string; name: string }[];
};

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
  getPageForCoach: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const page = await ctx.prisma.page.findFirst({
        where: { userId: input },
      });
      if (page) return page;
      const user = await ctx.prisma.user.findUnique({ where: { id: input } });
      if (!user)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error fetching user ${input}`,
        });
      return ctx.prisma.page.create({
        data: {
          name: user.name ?? "coach",
          target: "HOME",
          userId: input,
          sections: {
            create: {
              model: "HERO",
              elements: {
                create: {
                  elementType: "HERO_CONTENT",
                  title: user.name,
                },
              },
            },
          },
        },
      });
    }),
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
  getSectionByModel: protectedProcedure
    .input(
      z.object({
        pageId: z.string().cuid().optional(),
        model: z.nativeEnum(PageSectionModel),
      })
    )
    .query(({ ctx, input }) => {
      if (!input.pageId) return null;
      return ctx.prisma.pageSection.findFirst({
        where: { pageId: input.pageId, model: input.model },
        include: {
          elements: {
            include: { images: true },
          },
        },
      });
    }),
  createPageSection: protectedProcedure
    .input(PageSectionObject.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.pageSection.create({
        data: {
          model: input.model,
          pageId: input.pageId,
        },
      })
    ),
  deletePageSection: protectedProcedure
    .input(
      z.object({ pageId: z.string().cuid(), sectionId: z.string().cuid() })
    )
    .mutation(async ({ ctx, input }) => {
      // await ctx.prisma.page.update({
      //   where: {
      //     id: input.pageId,
      //   },
      //   data: {
      //     sections: {
      //       disconnect: {
      //         id: input.sectionId,
      //       },
      //     },
      //   },
      // });
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
          sectionId: input.sectionId,
          optionValue: input.optionValue,
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
          optionValue: input.optionValue,
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
  getCoachDataForPage: publicProcedure
    .input(z.string())
    .query<GetCoachDataForPageReturn>(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input },
        include: {
          certifications: {
            include: {
              modules: true,
              activityGroups: true,
            },
          },
        },
      });
      const activities = new Map<string, { id: string; name: string }>();
      if (user?.certifications)
        for (const mod of user.certifications)
          for (const ag of mod.activityGroups)
            activities.set(ag.id, { id: ag.id, name: ag.name });
      const certifications =
        user?.certifications.map((c) => ({ id: c.id, name: c.name })) ?? [];
      return { certifications, activities: Array.from(activities.values()) };
    }),
  updatePagePublication: protectedProcedure
    .input(z.object({ pageId: z.string().cuid(), published: z.boolean() }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.page.update({
        where: { id: input.pageId },
        data: { published: input.published },
      })
    ),
});
