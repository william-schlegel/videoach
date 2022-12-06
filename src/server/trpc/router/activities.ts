import { Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const activityRouter = router({
  getActivityById: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.activity.findFirst({
        where: { id: input },
      });
    }),
  getActivityGroupById: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.activityGroup.findFirst({
        where: { id: input },
      });
    }),
  getActivityGroupsForUser: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.activityGroup.findMany({
        where: {
          OR: [
            {
              default: true,
            },
            { userId: input },
          ],
        },
      });
    }),
  getAllActivities: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.activity.findMany();
  }),
  getActivitiesForClub: protectedProcedure
    .input(z.object({ clubId: z.string().cuid(), userId: z.string().cuid() }))
    .query(({ ctx, input }) => {
      if (
        ctx.session.user.role !== Role.ADMIN &&
        ctx.session.user.id !== input.userId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to query activities from this club",
        });

      return ctx.prisma.club.findUnique({
        where: { id: input.clubId },
        select: {
          activities: true,
        },
      });
    }),
  createActivity: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        groupId: z.string().cuid(),
        clubId: z.string().cuid(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.activity.create({
        data: {
          name: input.name,
          groupId: input.groupId,
          clubId: input.clubId,
        },
      })
    ),
  updateActivity: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        clubId: z.string().cuid(),
        groupId: z.string().cuid(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.activity.update({
        where: { id: input.id },
        data: {
          name: input.name,
          groupId: input.groupId,
          clubId: input.clubId,
        },
      })
    ),
  deleteActivity: protectedProcedure
    .input(
      z.object({
        activityId: z.string().cuid(),
        clubId: z.string().cuid(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.activity.delete({ where: { id: input.activityId } })
    ),
});
