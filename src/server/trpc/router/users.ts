import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

const UserFilter = z
  .object({
    name: z.string(),
    email: z.string(),
    role: z.nativeEnum(Role),
    dueDate: z.date(),
    dateOperation: z.enum(["gt", "lt"]),
  })
  .partial();

type Filter = {
  name?: object;
  email?: object;
  role?: Role;
  dueDate?: object;
};
// Partial<Record<keyof z.infer<typeof UserFilter>, object | Role| string>>;

export const userRouter = router({
  getUserById: publicProcedure
    .input(z.string().cuid())
    .query(({ ctx, input }) => {
      return ctx.prisma.user.findUnique({
        where: { id: input },
        include: {
          pricing: true,
          paiements: true,
          accounts: true,
        },
      });
    }),
  getUserFullById: protectedProcedure
    .input(z.string().cuid())
    .query(({ ctx, input }) => {
      if (ctx.session.user?.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can acceed full",
        });
      return ctx.prisma.user.findUnique({
        where: { id: input },
        include: {
          pricing: true,
          paiements: true,
          managedClubs: {
            select: { _count: true },
          },
          certifications: true,
          clubs: true,
        },
      });
    }),
  getAllUsers: protectedProcedure
    .input(
      z.object({
        filter: UserFilter,
        skip: z.number(),
        take: z.number(),
      })
    )
    .query(({ ctx, input }) => {
      if (ctx.session.user?.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can acceed users",
        });
      const filter: Filter = {};
      if (input.filter?.name) filter.name = { contains: input.filter.name };
      if (input.filter?.email) filter.email = { contains: input.filter.email };
      if (input.filter?.role) filter.role = input.filter.role;
      if (input.filter?.dueDate)
        filter.dueDate = {
          [input.filter.dateOperation ?? "lt"]: input.filter.dueDate,
        };
      return ctx.prisma.$transaction([
        ctx.prisma.user.count({ where: filter }),
        ctx.prisma.user.findMany({
          where: filter,
          take: input.take,
          skip: input.skip,
        }),
      ]);
    }),

  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        longitude: z.number().optional(),
        latitude: z.number().optional(),
        googleAddress: z.string().optional(),
        role: z.nativeEnum(Role),
      })
    )
    .mutation(({ ctx, input }) => {
      if (input.role === Role.ADMIN && ctx.session.user?.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can give admin access",
        });
      return ctx.prisma.user.update({
        where: { id: input.id },
        data: { ...input },
      });
    }),
  changeUserPlan: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        pricingId: z.string().cuid().optional(),
        monthlyPayment: z.boolean().optional(),
        cancelationDate: z.date().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.user.update({
        where: { id: input.id },
        data: { ...input },
      })
    ),
  deleteUser: protectedProcedure
    .input(z.string())
    .mutation(({ ctx, input }) => {
      if (ctx.session.user?.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can delete a user",
        });
      return ctx.prisma.user.delete({ where: { id: input } });
    }),
  updatePaymentPeriod: protectedProcedure
    .input(z.object({ userId: z.string().cuid(), monthlyPayment: z.boolean() }))
    .mutation(({ ctx, input }) => {
      if (
        ctx.session.user?.id !== input.userId &&
        ctx.session.user?.role !== Role.ADMIN
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin or actual user can change periodicity",
        });
      return ctx.prisma.user.update({
        where: { id: input.userId },
        data: { monthlyPayment: input.monthlyPayment },
      });
    }),
});
