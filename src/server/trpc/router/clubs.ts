import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const clubRouter = router({
  getClubById: protectedProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.club.findFirst({
      where: { userId: input },
    });
  }),
  getClubsForManager: protectedProcedure
    .input(z.string())
    .query(({ ctx, input }) => {
      return ctx.prisma.club.findMany({
        where: { userId: input },
      });
    }),
  createClub: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        address: z.string(),
        userId: z.string().cuid(),
      })
    )
    .mutation(({ ctx, input }) => {
      return ctx.prisma.club.create({ data: input });
    }),
  // updateUser: protectedProcedure
  //   .input(
  //     z.object({
  //       id: z.string(),
  //       name: z.string().optional(),
  //       email: z.string().email().optional(),
  //       role: z.nativeEnum(Role),
  //     })
  //   )
  //   .mutation(({ ctx, input }) => {
  //     if (input.role === Role.ADMIN && ctx.session.user?.role !== Role.ADMIN)
  //       throw new TRPCError({
  //         code: "UNAUTHORIZED",
  //         message: "Only an admin user can give admin access",
  //       });
  //     return ctx.prisma.user.update({
  //       where: { id: input.id },
  //       data: { ...input },
  //     });
  //   }),
});
