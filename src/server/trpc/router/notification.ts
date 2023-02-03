import { NotificationType } from "@prisma/client";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const notificationRouter = router({
  getNotificationById: protectedProcedure
    .input(
      z.object({
        notificationId: z.string().cuid(),
        noUpdate: z.boolean().default(false).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const notification = await ctx.prisma.userNotification.findUnique({
        where: { id: input.notificationId },
        include: {
          userFrom: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      });
      if (!notification?.viewDate && !input.noUpdate) {
        ctx.prisma.userNotification.update({
          where: { id: input.notificationId },
          data: {
            viewDate: new Date(Date.now()),
          },
        });
      }
      return notification;
    }),
  updateNotification: protectedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        answered: z.date(),
        answer: z.string(),
        linkedNotification: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      ctx.prisma.userNotification.update({
        where: { id: input.id },
        data: {
          answered: input.answered,
          answer: input.answer,
          linkedNotification: input.linkedNotification,
        },
      })
    ),
  getNotificationFromUser: protectedProcedure
    .input(
      z.object({
        userFromId: z.string().cuid(),
        take: z.number().default(10),
        skip: z.number().default(0),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(({ ctx, input }) =>
      ctx.prisma.userNotification.findMany({
        where: { userFromId: input.userFromId },
        take: input.take,
        skip: input.skip,
      })
    ),
  getNotificationToUser: protectedProcedure
    .input(
      z.object({
        userToId: z.string().cuid(),
        take: z.number().default(10).optional(),
        skip: z.number().default(0).optional(),
        unreadOnly: z.boolean().default(false).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const total = await ctx.prisma.userNotification.count({
        where: { userToId: input.userToId },
      });
      const unread = await ctx.prisma.userNotification.count({
        where: { userToId: input.userToId, viewDate: null },
      });
      const notifications = await ctx.prisma.userNotification.findMany({
        where: { userToId: input.userToId },
        take: input.take,
        skip: input.skip,
      });
      return { notifications, unread, total };
    }),
  createNotificationToUsers: protectedProcedure
    .input(
      z.object({
        type: z.nativeEnum(NotificationType),
        from: z.string().cuid(),
        to: z.array(z.string().cuid()),
        message: z.string(),
        data: z.string().optional(),
        linkedNotification: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const data = input.data ? JSON.parse(input.data) : {};
      return ctx.prisma.userNotification.createMany({
        data: input.to.map((to) => ({
          type: input.type,
          userFromId: input.from,
          userToId: to,
          message: input.message,
          data,
          linkedNotification: input.linkedNotification,
        })),
      });
    }),
  createNotificationToUser: protectedProcedure
    .input(
      z.object({
        type: z.nativeEnum(NotificationType),
        from: z.string().cuid(),
        to: z.string().cuid(),
        message: z.string(),
        data: z.string().optional(),
        linkedNotification: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const data = input.data ? JSON.parse(input.data) : {};
      return ctx.prisma.userNotification.create({
        data: {
          type: input.type,
          userFromId: input.from,
          userToId: input.to,
          message: input.message,
          data,
          linkedNotification: input.linkedNotification,
        },
      });
    }),
});
