import { Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { getDocUrl } from "./files";

export const clubRouter = router({
  getClubById: protectedProcedure
    .input(z.string().cuid())
    .query(async ({ ctx, input }) => {
      const myClub = await ctx.prisma.club.findUnique({
        where: { id: input },
        include: {
          sites: {
            include: {
              rooms: {
                include: {
                  activities: true,
                },
              },
            },
          },
          activities: { include: { group: true } },
          logo: true,
        },
      });
      let logoUrl = "";
      if (myClub?.logoId) {
        logoUrl = await getDocUrl(myClub.managerId, myClub.logoId);
      }
      return { ...myClub, logoUrl };
    }),
  getClubsForManager: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.club.findMany({
        where: { managerId: input },
        orderBy: { name: "asc" },
      });
    }),
  getAllClubs: publicProcedure.query(({ ctx }) =>
    ctx.prisma.club.findMany({
      orderBy: { name: "asc" },
      include: { activities: { include: { group: true } }, pages: true },
    })
  ),
  createClub: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        address: z.string(),
        userId: z.string().cuid(),
        searchAddress: z.string(),
        longitude: z.number(),
        latitude: z.number(),
        logoId: z.string().cuid().optional(),
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
          managerId: input.userId,
          sites: input.isSite
            ? {
                create: {
                  name: input.name,
                  address: input.address,
                },
              }
            : undefined,
          logoId: input.logoId ? input.logoId : undefined,
          searchAddress: input.searchAddress,
          longitude: input.longitude,
          latitude: input.latitude,
        },
      });
      return club;
    }),
  updateClub: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        address: z.string(),
        searchAddress: z.string(),
        longitude: z.number(),
        latitude: z.number(),
        logoId: z.string().cuid().nullable(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.prisma.club.findFirst({
        where: { id: input.id },
      });
      if (
        ctx.session.user.role !== Role.ADMIN &&
        ctx.session.user.id !== club?.managerId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to modify this club",
        });
      const initialLogoId = club?.logoId;
      const data: {
        name: string;
        address: string;
        latitude: number;
        longitude: number;
        searchAddress?: string;
        logoId: string | null;
      } = {
        name: input.name,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        logoId: input.logoId,
      };
      if (input.searchAddress) data.searchAddress = input.searchAddress;
      // if (input.logoId) data.logoId = input.logoId;

      const updated = await ctx.prisma.club.update({
        where: { id: input.id },
        data,
      });
      if (initialLogoId && !input.logoId) {
        ctx.prisma.userDocument.delete({ where: { id: initialLogoId } });
      }
      return updated;
    }),
  updateClubCalendar: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        calendarId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.club.update({
        where: { id: input.id },
        data: {
          calendars: { connect: { id: input.calendarId } },
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
        ctx.session.user.id !== club?.managerId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete this club",
        });
      return ctx.prisma.club.delete({ where: { id: input } });
    }),
  updateClubActivities: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        activities: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.prisma.club.findFirst({
        where: { id: input.id },
      });
      if (
        ctx.session.user.role !== Role.ADMIN &&
        ctx.session.user.id !== club?.managerId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to modify this club",
        });

      return ctx.prisma.club.update({
        where: { id: input.id },
        data: {
          activities: { connect: input.activities.map((id) => ({ id })) },
        },
      });
    }),
  updateClubCoach: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        coachId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.prisma.club.findFirst({
        where: { id: input.id },
      });
      if (
        ctx.session.user.role !== Role.ADMIN &&
        ctx.session.user.id !== club?.managerId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to modify this club",
        });

      return ctx.prisma.user.update({
        where: { id: input.coachId },
        data: {
          clubs: {
            connect: {
              id: input.id,
            },
          },
        },
      });
    }),
});
