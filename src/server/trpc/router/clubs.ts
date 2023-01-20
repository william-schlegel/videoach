// import { LATITUDE, LONGITUDE } from "@lib/defaultValues";
import { Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";
// import { calculateBBox, calculateDistance } from "@trpcserver/lib/distance";
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
  // getClubsFromDistance: publicProcedure
  //   .input(
  //     z.object({
  //       locationLng: z.number().default(LONGITUDE),
  //       locationLat: z.number().default(LATITUDE),
  //       range: z.number().max(100).default(25),
  //     })
  //   )
  //   .query(async ({ input, ctx }) => {
  //     const bbox = calculateBBox(
  //       input.locationLng,
  //       input.locationLat,
  //       input.range
  //     );
  //     const clubs = await ctx.prisma.club.findMany({
  //       where: {
  //         AND: [
  //           { longitude: { gte: bbox?.[0]?.[0] ?? LONGITUDE } },
  //           { longitude: { lte: bbox?.[1]?.[0] ?? LONGITUDE } },
  //           { latitude: { gte: bbox?.[1]?.[1] ?? LATITUDE } },
  //           { latitude: { lte: bbox?.[0]?.[1] ?? LATITUDE } },
  //         ],
  //       },
  //       include: { activities: { include: { group: true } }, pages: true },
  //     });
  //     return clubs
  //       .map((club) => ({
  //         ...club,
  //         distance: calculateDistance(
  //           input.locationLng,
  //           input.locationLat,
  //           club.longitude,
  //           club.latitude
  //         ),
  //       }))
  //       .filter((c) => c.distance <= input.range);
  //   }),
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
                  searchAddress: input.searchAddress,
                  longitude: input.longitude,
                  latitude: input.latitude,
                },
              }
            : undefined,
          logoId: input.logoId ? input.logoId : undefined,
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
        logoId: string | null;
      } = {
        name: input.name,
        address: input.address,
        logoId: input.logoId,
      };

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
        clubId: z.string().cuid(),
        coachId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const club = await ctx.prisma.club.findFirst({
        where: { id: input.clubId },
      });
      if (
        ctx.session.user.role !== Role.ADMIN &&
        ctx.session.user.id !== club?.managerId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to modify this club",
        });

      return ctx.prisma.userCoach.update({
        where: { userId: input.coachId },
        data: {
          clubs: {
            connect: {
              id: input.clubId,
            },
          },
        },
      });
    }),
});
