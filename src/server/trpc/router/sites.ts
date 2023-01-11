import { RoomReservation } from "@prisma/client";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const RoomObject = z.object({
  id: z.string().cuid(),
  siteId: z.string().cuid(),
  name: z.string(),
  reservation: z.nativeEnum(RoomReservation),
  capacity: z.number(),
  unavailable: z.boolean(),
  openWithClub: z.boolean().default(true),
  openWithSite: z.boolean().default(true),
});

export const siteRouter = router({
  getSiteById: protectedProcedure
    .input(z.string().cuid())
    .query(({ ctx, input }) => {
      return ctx.prisma.site.findUnique({
        where: { id: input },
        include: { rooms: true },
      });
    }),
  getSitesForClub: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.site.findMany({
        where: { clubId: input },
        include: { rooms: true },
        orderBy: { name: "asc" },
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
    .mutation(({ ctx, input }) =>
      ctx.prisma.site.create({
        data: {
          address: input.address,
          name: input.name,
          clubId: input.clubId,
        },
      })
    ),
  updateSite: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        address: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.site.update({
        where: { id: input.id },
        data: {
          name: input.name,
          address: input.address,
        },
      });
    }),
  updateSiteCalendar: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        calendarId: z.string().cuid(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.site.update({
        where: { id: input.id },
        data: {
          calendars: { connect: { id: input.calendarId } },
        },
      })
    ),
  deleteSite: protectedProcedure
    .input(z.string().cuid())
    .mutation(({ ctx, input }) =>
      ctx.prisma.site.delete({ where: { id: input } })
    ),
  /**  ------------------- ROOMS -------------------- **/
  getRoomById: protectedProcedure
    .input(z.string().cuid())
    .query(({ ctx, input }) => {
      return ctx.prisma.room.findUnique({
        where: { id: input },
      });
    }),
  getRoomsForSite: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.room.findMany({
        where: { siteId: input },
        orderBy: { name: "asc" },
      });
    }),

  createRoom: protectedProcedure
    .input(RoomObject.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.room.create({
        data: { ...input },
      })
    ),
  updateRoom: protectedProcedure
    .input(RoomObject.partial())
    .mutation(({ ctx, input }) => {
      console.log("input", input);
      return ctx.prisma.room.update({
        where: { id: input.id },
        data: input,
      });
    }),
  deleteRoom: protectedProcedure
    .input(z.string().cuid())
    .mutation(({ ctx, input }) =>
      ctx.prisma.room.delete({ where: { id: input } })
    ),
  updateRoomCalendar: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        openWithClub: z.boolean().optional(),
        openWithSite: z.boolean().optional(),
        calendarId: z.string().cuid().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.room.update({
        where: { id: input.id },
        data: {
          calendars: { connect: { id: input.calendarId } },
        },
      })
    ),
});
