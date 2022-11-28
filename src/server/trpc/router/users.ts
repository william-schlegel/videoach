import { TRPCError } from "@trpc/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

export const userRouter = router({
  getUserById: publicProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.prisma.user.findFirst({
      where: { id: input },
    });
  }),
  updateUser: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        role: z.nativeEnum(Role),
      })
    )
    .mutation(({ ctx, input }) => {
      if (input.role === "ADMIN" && ctx.session.user?.role !== "ADMIN")
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only an admin user can give admin access",
        });
      console.log("input :>> ", input);
      return ctx.prisma.user.update({
        where: { id: input.id },
        data: { ...input },
      });
    }),
});
