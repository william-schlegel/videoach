import { Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
// import { siteRouter } from "./sites";

export const clubRouter = router({
  getClubById: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.club.findUnique({
      where: { id: input },
      include: { sites: true, activities: true },
    });
  }),
  getClubsForManager: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.club.findMany({
        where: { userId: input },
      });
    }),
  createClub: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        address: z.string(),
        userId: z.string().cuid(),
        isSite: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (
        ctx.session.user.role !== Role.ADMIN &&
        ctx.session.user.id !== input.userId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to create a club for this user",
        });
      const club = await ctx.prisma.club.create({
        data: {
          name: input.name,
          address: input.address,
          userId: input.userId,
          sites: input.isSite
            ? {
                create: {
                  name: input.name,
                  address: input.address,
                },
              }
            : undefined,
        },
      });
      // if (input.isSite) {
      //   const caller = siteRouter.createCaller(ctx);
      //   caller.createSite({
      //     name: input.name,
      //     address: input.address,
      //     clubId: club.id,
      //   });
      // }
      return club;
    }),
  updateClub: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        address: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.prisma.club.findFirst({
        where: { id: input.id },
      });
      if (
        ctx.session.user.role !== Role.ADMIN &&
        ctx.session.user.id !== club?.userId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to modify this club",
        });

      return ctx.prisma.club.update({
        where: { id: input.id },
        data: {
          name: input.name,
          address: input.address,
        },
      });
    }),
  deleteClub: protectedProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.prisma.club.findFirst({
        where: { id: input },
      });
      if (
        ctx.session.user.role !== Role.ADMIN &&
        ctx.session.user.id !== club?.userId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete this club",
        });
      return ctx.prisma.club.delete({ where: { id: input } });
    }),
});
