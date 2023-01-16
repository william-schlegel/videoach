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
          coachData: true,
          pricing: true,
          paiements: true,
          accounts: true,
        },
      });
    }),
  getUserSubscriptionsById: protectedProcedure
    .input(z.string().cuid())
    .query(({ ctx, input }) => {
      return ctx.prisma.user.findUnique({
        where: { id: input },
        include: {
          memberData: {
            include: {
              subscriptions: {
                include: {
                  activitieGroups: true,
                  activities: true,
                  sites: true,
                  rooms: true,
                  club: true,
                },
              },
            },
          },
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
          managerData: {
            include: {
              managedClubs: {
                select: { _count: true },
              },
            },
          },
          coachData: {
            include: {
              certifications: true,
              page: true,
              clubs: true,
            },
          },
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
        role: z.nativeEnum(Role),
        pricingId: z.string().cuid().optional(),
        monthlyPayment: z.boolean().optional(),
        cancelationDate: z.date().optional(),
        // coach data
        longitude: z.number().optional(),
        latitude: z.number().optional(),
        searchAddress: z.string().optional(),
        range: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.role === Role.ADMIN && ctx.session.user?.role !== Role.ADMIN)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can give admin access",
        });
      if (input.role === Role.COACH || input.role === Role.MANAGER_COACH) {
        await ctx.prisma.userCoach.upsert({
          where: { userId: input.id },
          update: {
            longitude: input.longitude,
            latitude: input.latitude,
            searchAddress: input.searchAddress,
            range: input.range,
          },
          create: {
            userId: input.id,
            longitude: input.longitude,
            latitude: input.latitude,
            searchAddress: input.searchAddress,
            range: input.range,
          },
        });
      }

      return ctx.prisma.user.update({
        where: { id: input.id },
        data: {
          name: input.name,
          email: input.email,
          phone: input.phone,
          address: input.address,
          role: input.role,
          pricingId: input.pricingId,
          monthlyPayment: input.monthlyPayment,
          cancelationDate: input.cancelationDate,
        },
      });
    }),
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
