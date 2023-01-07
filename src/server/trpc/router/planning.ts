import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const planningObject = z.object({
  id: z.string().cuid(),
  clubId: z.string().cuid(),
  startDate: z.date().default(new Date(Date.now())),
  siteId: z.string().cuid().optional(),
  roomId: z.string().cuid().optional(),
  endDate: z.date().optional(),
  name: z.string().optional(),
});

export const planningRouter = router({
  getPlanningsForClub: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) =>
      ctx.prisma.planning.findMany({
        where: { clubId: input },
        orderBy: { startDate: "desc" },
      })
    ),

  getPlanningById: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) =>
      ctx.prisma.planning.findUnique({
        where: { id: input },
        include: {
          planningActivities: true,
          site: {
            select: { name: true },
          },
          room: {
            select: { name: true },
          },
        },
      })
    ),
  createPlanningForClub: protectedProcedure
    .input(planningObject.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.planning.create({
        data: input,
      })
    ),
  updatePlanningForClub: protectedProcedure
    .input(planningObject.partial())
    .mutation(({ ctx, input }) =>
      ctx.prisma.planning.update({
        where: { id: input.id },
        data: input,
      })
    ),
  duplicatePlanningForClub: protectedProcedure
    .input(planningObject.partial())
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.prisma.planning.findUnique({
        where: { id: input.id },
        include: { planningActivities: true },
      });
      if (!org) return null;
      return ctx.prisma.planning.create({
        data: {
          clubId: org.clubId,
          name: input.name ?? org.name,
          startDate: input.startDate,
          endDate: input.endDate,
          siteId: org.siteId,
          roomId: org.roomId,
          planningActivities: {
            createMany: {
              data: org.planningActivities.map((pa) => ({
                day: pa.day,
                startTime: pa.startTime,
                endTime: pa.endTime,
                activityGroupId: pa.activityGroupId,
                activityId: pa.activityId,
                coachId: pa.coachId,
                siteId: pa.siteId,
                roomId: pa.roomId,
              })),
            },
          },
        },
      });
    }),
  deletePlanning: protectedProcedure
    .input(z.string())
    .mutation(({ ctx, input }) =>
      ctx.prisma.planning.delete({
        where: { id: input },
      })
    ),
});
