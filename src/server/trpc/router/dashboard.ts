import { Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const dashboardRouter = router({
  getManagerDataForUserId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (
        ctx.session.user.role !== Role.ADMIN &&
        ctx.session.user.role !== Role.MANAGER &&
        ctx.session.user.role !== Role.MANAGER_COACH
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You cannot read manager data",
        });
      const clubData = await ctx.prisma.club.findMany({
        where: { managerId: input },
        include: {
          sites: {
            include: { _count: true },
          },
          activities: {
            select: { name: true },
          },
          members: {
            select: {
              _count: true,
            },
          },
          subscriptions: {
            select: {
              _count: true,
            },
          },
        },
      });
      return clubData;
    }),
  getCoachDataForUserId: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (
        ctx.session.user.role !== Role.ADMIN &&
        ctx.session.user.role !== Role.COACH &&
        ctx.session.user.role !== Role.MANAGER_COACH
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You cannot read coach data",
        });
      const clubData = await ctx.prisma.user.findUnique({
        where: { id: input },
        include: {
          clubs: true,
          certifications: true,
          activityGroups: true,
          page: true,
        },
      });
      return clubData;
    }),
  getAdminData: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== Role.ADMIN)
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not admin",
      });
    const clubs = await ctx.prisma.club.findMany({
      include: { sites: { include: { _count: true } } },
    });
    const members = await ctx.prisma.user.findMany();
    return {
      clubs,
      members,
    };
  }),
});
