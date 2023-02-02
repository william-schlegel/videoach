import { NotificationType } from "@prisma/client";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const notificationRouter = router({
  getNotificationById: protectedProcedure
    .input(z.string().cuid())
    .query(({ ctx, input }) =>
      ctx.prisma.userNotification.findUnique({
        where: { id: input },
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
      const unread = await ctx.prisma.userNotification.count({
        where: { userToId: input.userToId, viewDate: null },
      });
      const notifications = await ctx.prisma.userNotification.findMany({
        where: { userToId: input.userToId },
        take: input.take,
        skip: input.skip,
      });
      return { notifications, unread };
    }),
  createNotificationToUsers: protectedProcedure
    .input(
      z.object({
        type: z.nativeEnum(NotificationType),
        from: z.string().cuid(),
        to: z.array(z.string().cuid()),
        message: z.string(),
        link: z
          .array(z.object({ text: z.string(), link: z.string().url() }))
          .max(2)
          .optional(),
        data: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const data = input.data ? JSON.parse(input.data) : {};
      console.log(
        "------------------------------------------------------  data",
        data
      );
      return ctx.prisma.userNotification.createMany({
        data: input.to.map((to) => ({
          type: input.type,
          userFromId: input.from,
          userToId: to,
          message: input.message,
          data,
        })),
      });
    }),
});
