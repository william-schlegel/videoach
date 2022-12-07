import { RoomReservation } from "@prisma/client";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const RoomObject = {
  name: z.string(),
  reservation: z.nativeEnum(RoomReservation),
  capacity: z.number(),
  unavailable: z.boolean(),
  openWithClub: z.boolean(),
  openingTime: z.date().optional().default(new Date("00:00:00")),
  closingTime: z.date().optional().default(new Date("23:59:59")),
};

export const siteRouter = router({
  getSiteById: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.site.findUnique({
      where: { id: input },
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
  createRoom: protectedProcedure
    .input(
      z.object({
        siteId: z.string().cuid(),
        ...RoomObject,
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.room.create({
        data: { ...input },
      })
    ),
  createRooms: protectedProcedure
    .input(
      z.array(
        z.object({
          siteId: z.string().cuid(),
          ...RoomObject,
        })
      )
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.room.createMany({
        data: [...input],
      })
    ),
  updateRoom: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        ...RoomObject,
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.room.update({
        where: { id: input.id },
        data: input,
      })
    ),
  deleteRoom: protectedProcedure
    .input(z.string().cuid())
    .mutation(({ ctx, input }) =>
      ctx.prisma.room.delete({ where: { id: input } })
    ),
});
