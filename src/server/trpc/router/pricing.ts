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
      include: { options: true },
    });
  }),
  getPricingForRole: publicProcedure
    .input(z.nativeEnum(Role))
    .query(({ ctx, input }) => {
      return ctx.prisma.pricing.findMany({
        where: { roleTarget: input, deleted: false },
        include: { options: true },
      });
    }),
  getAllPricing: protectedProcedure.query(({ ctx }) => {
    if (ctx.session.user.role !== Role.ADMIN)
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You are not authorized to query pricing",
      });
    return ctx.prisma.pricing.findMany({
      orderBy: [{ roleTarget: "asc" }],
    });
  }),
  createPricing: protectedProcedure
    .input(
      z.object({
        base: PricingObject.omit({ id: true }),
        options: z.array(z.string()),
      })
    )
    .mutation(({ input, ctx }) => {
      if (ctx.session.user.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to create a pricing",
        });
      return ctx.prisma.pricing.create({
        data: {
          ...input.base,
          options: {
            createMany: {
              data: input.options.map((o, i) => ({ name: o, weight: i })),
            },
          },
        },
      });
    }),
  updatePricing: protectedProcedure
    .input(
      z.object({
        base: PricingObject.partial(),
        options: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.session.user.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to modify a pricing",
        });
      await ctx.prisma.pricingOption.deleteMany({
        where: { pricingId: input.base.id },
      });
      console.log("input.base :>> ", input.base);
      return ctx.prisma.pricing.update({
        where: { id: input.base.id },
        data: {
          ...input.base,
          options: {
            createMany: {
              data: input.options.map((o, i) => ({ name: o, weight: i })),
            },
          },
        },
      });
    }),
  deletePricing: protectedProcedure
    .input(z.string())
    .mutation(({ input, ctx }) => {
      if (ctx.session.user.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete a pricing",
        });
      return ctx.prisma.pricing.update({
        where: { id: input },
        data: { deleted: true, deletionDate: new Date(Date.now()) },
      });
    }),
  undeletePricing: protectedProcedure
    .input(z.string())
    .mutation(({ input, ctx }) => {
      if (ctx.session.user.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to undelete a pricing",
        });
      return ctx.prisma.pricing.update({
        where: { id: input },
        data: { deleted: false, deletionDate: null },
      });
    }),
  deletePricingOption: protectedProcedure
    .input(z.string())
    .mutation(({ input, ctx }) => {
      if (ctx.session.user.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete a pricing option",
        });
      return ctx.prisma.pricingOption.deleteMany({ where: { name: input } });
    }),
});
