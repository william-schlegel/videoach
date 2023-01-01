import { PageTarget } from "@prisma/client";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const PageObject = z.object({
  id: z.string().cuid(),
  name: z.string(),
  clubId: z.string().cuid(),
  target: z.nativeEnum(PageTarget),
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
});
