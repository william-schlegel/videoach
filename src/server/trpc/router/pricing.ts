import { Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";

const PricingObject = z.object({
  id: z.string().cuid(),
  roleTarget: z.nativeEnum(Role),
  title: z.string(),
  description: z.string(),
  free: z.boolean().optional().default(false),
  highlighted: z.boolean().optional().default(false),
  monthly: z.number().optional().default(0),
  yearly: z.number().optional().default(0),
});

export const pricingRouter = router({
  getPricingById: publicProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.pricing.findUnique({
      where: { id: input },
    });
  }),
  getPricingForRole: publicProcedure
    .input(z.nativeEnum(Role))
    .query(({ ctx, input }) => {
      return ctx.prisma.pricing.findMany({
        where: { roleTarget: input },
      });
    }),
  createPricing: protectedProcedure
    .input(PricingObject.omit({ id: true }))
    .mutation(({ input, ctx }) => {
      if (ctx.session.user.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to create a pricing",
        });
      ctx.prisma.pricing.create({
        data: input,
      });
    }),
  updatePricing: protectedProcedure
    .input(PricingObject.partial())
    .mutation(({ input, ctx }) => {
      if (ctx.session.user.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to modify a pricing",
        });
      ctx.prisma.pricing.update({
        where: { id: input.id },
        data: input,
      });
    }),
});
