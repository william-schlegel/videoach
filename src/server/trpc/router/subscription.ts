import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const subscriptionObject = z.object({
  id: z.string().cuid(),
  name: z.string(),
  highlight: z.string(),
  description: z.string(),
  startDate: z.date(),
  monthly: z.number(),
  yearly: z.number(),
  cancelationFee: z.number(),
  clubId: z.string().cuid(),
});

export const subscriptionRouter = router({
  getSubscriptionById: protectedProcedure
    .input(z.string().cuid())
    .query(({ ctx, input }) => {
      return ctx.prisma.subscription.findUnique({
        where: { id: input },
        include: { activitieGroups: true, users: true },
      });
    }),
  getSubscriptionsForClub: protectedProcedure
    .input(z.string().cuid())
    .query(({ ctx, input }) => {
      return ctx.prisma.subscription.findMany({
        where: { clubId: input },
        orderBy: { startDate: "desc" },
      });
    }),
  createSubscription: protectedProcedure
    .input(subscriptionObject.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.subscription.create({
        data: input,
      })
    ),
  updateSubscription: protectedProcedure
    .input(subscriptionObject.partial())
    .mutation(({ ctx, input }) => {
      return ctx.prisma.subscription.update({
        where: { id: input.id },
        data: input,
      });
    }),
  deleteSubscription: protectedProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      const sub = await ctx.prisma.subscription.findUnique({
        where: { id: input },
        include: { users: { select: { id: true } } },
      });
      if (!sub)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `unknown subscription ${input}`,
        });
      if (sub.users.length > 0) {
        return ctx.prisma.subscription.update({
          where: { id: input },
          data: {
            deletionDate: new Date(Date.now()),
          },
        });
      } else {
        return ctx.prisma.subscription.delete({ where: { id: input } });
      }
    }),
});
