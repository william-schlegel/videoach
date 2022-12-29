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
          activityGroups: true,
          modules: true,
        },
      })
    ),
  getCertificationGroups: protectedProcedure.query(({ ctx }) =>
    ctx.prisma.certificationGroup.findMany({
      include: { modules: { include: { _count: true } } },
    })
  ),
  getCertificationGroupById: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) =>
      ctx.prisma.certificationGroup.findUnique({
        where: {
          id: input,
        },
        include: { modules: { include: { activityGroups: true } } },
      })
    ),
  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        modules: z.array(
          z.object({
            name: z.string(),
            activityIds: z.array(z.string().cuid()),
          })
        ),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.$transaction(async (tx) => {
        const group = await tx.certificationGroup.create({
          data: {
            name: input.name,
          },
        });
        input.modules.forEach(async (module) => {
          await tx.certificationModule.create({
            data: {
              name: module.name,
              certificationGroupId: group.id,
              activityGroups: {
                connect: module.activityIds.map((id) => ({ id })),
              },
            },
          });
        });
        return group;
      })
    ),
  updateGroup: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.certificationGroup.update({
        where: { id: input.id },
        data: {
          name: input.name,
        },
      })
    ),
  deleteGroup: protectedProcedure
    .input(z.string().cuid())
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== Role.ADMIN)
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
        activityIds: z.array(z.string().cuid()),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.certificationModule.create({
        data: {
          name: input.name,
          certificationGroupId: input.groupId,
          activityGroups: {
            connect: input.activityIds.map((id) => ({ id })),
          },
        },
      })
    ),
  updateModule: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        activityIds: z.array(z.string().cuid()),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.certificationModule.update({
        where: { id: input.id },
        data: {
          name: input.name,
          activityGroups: {
            connect: input.activityIds.map((id) => ({ id })),
          },
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
