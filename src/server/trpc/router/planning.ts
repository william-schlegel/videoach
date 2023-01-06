import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const planningRouter = router({
  getPlanningsForClub: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) =>
      ctx.prisma.planning.findMany({
        where: { id: input },
        orderBy: { startDate: "desc" },
      })
    ),

  getPlanningById: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) =>
      ctx.prisma.planning.findUnique({
        where: { id: input },
        include: { planningActivities: true },
      })
    ),
  createPlanningForClub: protectedProcedure
    .input(
      z.object({
        clubId: z.string().cuid(),
        startDate: z.date().default(new Date(Date.now())),
        siteId: z.string().cuid().optional(),
        roomId: z.string().cuid().optional(),
        endDate: z.date().optional(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) =>
      ctx.prisma.planning.create({
        data: input,
      })
    ),
});
