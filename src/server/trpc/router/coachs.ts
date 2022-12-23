import { Role } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";

const CertificationData = z.object({
  id: z.string().cuid(),
  name: z.string(),
  certificationGroupId: z.string(),
  obtainedIn: z.date(),
  documentUrl: z.string().url().optional(),
  userId: z.string().cuid(),
  activityGroupId: z.string().cuid().optional(),
});

export const coachRouter = router({
  getCoachById: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.user.findUnique({
      where: { id: input },
      include: {
        activityGroups: true,
        certifications: true,
        clubs: true,
      },
    });
  }),
  createCertification: protectedProcedure
    .input(CertificationData.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.prisma.certification.create({
        data: input,
      })
    ),
  updateCertification: protectedProcedure
    .input(CertificationData.partial())
    .mutation(({ ctx, input }) =>
      ctx.prisma.certification.update({
        where: { id: input.id },
        data: input,
      })
    ),
  deleteCertification: protectedProcedure
    .input(z.string())
    .mutation(({ ctx, input }) =>
      ctx.prisma.certification.delete({ where: { id: input } })
    ),
  getAllCoachs: publicProcedure.query(({ ctx }) =>
    ctx.prisma.user.findMany({
      where: { role: { in: ["COACH", "MANAGER_COACH"] } },
    })
  ),

  getCertificationsForCoach: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) =>
      ctx.prisma.user.findUnique({
        where: { id: input },
        include: {
          certifications: true,
        },
      })
    ),
  getCertificationById: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) =>
      ctx.prisma.certification.findUnique({
        where: { id: input },
        include: {
          activityGroup: true,
          certificationGroup: true,
          modules: true,
        },
      })
    ),
  getCertificationGroupsForCoach: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) =>
      ctx.prisma.certificationGroup.findMany({
        where: {
          OR: [{ userId: input }, { default: true }],
        },
        include: { modules: true },
      })
    ),
  getCertificationGroupById: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) =>
      ctx.prisma.certificationGroup.findUnique({
        where: {
          id: input,
        },
        include: { modules: true },
      })
    ),
  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        userId: z.string().cuid(),
        hasModules: z.boolean().default(false),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.certificationGroup.create({
        data: {
          name: input.name,
          userId: input.userId,
          hasModules: input.hasModules,
          default: false,
        },
      })
    ),
  updateGroup: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        hasModules: z.boolean().default(false),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.certificationGroup.update({
        where: { id: input.id },
        data: {
          name: input.name,
          hasModules: input.hasModules,
        },
      })
    ),
  deleteGroup: protectedProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      const group = await ctx.prisma.certificationGroup.findUnique({
        where: { id: input },
      });
      if (
        ctx.session.user.role !== Role.ADMIN &&
        ctx.session.user.id !== group?.userId
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not authorized to delete this group",
        });

      return ctx.prisma.certificationGroup.delete({
        where: { id: input },
      });
    }),
  createModule: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        groupId: z.string().cuid(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.certificationModule.create({
        data: {
          name: input.name,
          certificationGroupId: input.groupId,
        },
      })
    ),
  updateModule: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.certificationModule.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      })
    ),
  deleteModule: protectedProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.certificationModule.delete({
        where: { id: input },
      });
    }),
});
