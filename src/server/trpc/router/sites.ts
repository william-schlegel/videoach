import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const siteRouter = router({
  getSiteById: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.site.findFirst({
      where: { id: input },
    });
  }),
  getSitesForClub: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.site.findMany({
        where: { clubId: input },
      });
    }),
  createSite: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        address: z.string(),
        clubId: z.string().cuid(),
      })
    )
    .mutation(({ ctx, input }) => ctx.prisma.site.create({ data: input })),
  updateSite: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        address: z.string(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.site.update({
        where: { id: input.id },
        data: {
          name: input.name,
          address: input.address,
        },
      })
    ),
  deleteSite: protectedProcedure
    .input(z.string().cuid())
    .mutation(({ ctx, input }) =>
      ctx.prisma.site.delete({ where: { id: input } })
    ),
});
