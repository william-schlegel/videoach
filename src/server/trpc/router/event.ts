import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const eventObject = z.object({
  id: z.string().cuid(),
  clubId: z.string().cuid(),
  name: z.string(),
  brief: z.string(),
  description: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  startDisplay: z.date(),
  endDisplay: z.date(),
  bannerText: z.string(),
  cancelled: z.boolean(),
  documentId: z.string().cuid().optional(),
  price: z.number(),
  free: z.boolean(),
  address: z.string(),
  searchAddress: z.string().optional().nullable(),
  latitude: z.number(),
  longitude: z.number(),
});

export const eventRouter = router({
  getEventById: protectedProcedure
    .input(z.string().cuid())
    .query(({ ctx, input }) => {
      return ctx.prisma.event.findUnique({
        where: { id: input },
      });
    }),
  getEventsForClub: protectedProcedure
    .input(z.string().cuid())
    .query(({ ctx, input }) => {
      return ctx.prisma.event.findMany({
        where: { clubId: input },
        orderBy: { startDate: "desc" },
      });
    }),
  createEvent: protectedProcedure
    .input(eventObject.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.event.create({
        data: input,
      })
    ),
  updateEvent: protectedProcedure
    .input(eventObject.partial())
    .mutation(({ ctx, input }) => {
      return ctx.prisma.event.update({
        where: { id: input.id },
        data: input,
      });
    }),
  deleteEvent: protectedProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.event.delete({ where: { id: input } });
    }),
});
