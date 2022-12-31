import { type UserDocument, UserDocumentType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@root/src/env/server.mjs";

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

const Bucket =
  process.env.NODE_ENV === "production" ? "videoach-prod" : "videoach-dev";

interface DocMetadata extends UserDocument {
  url: string;
}

export const fileRouter = router({
  createPresignedUrl: protectedProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        maxSize: z
          .number()
          .optional()
          .default(1024 * 1024),
        fileType: z.string(),
        documentType: z.nativeEnum(UserDocumentType),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (
        ctx.session.user.role !== "ADMIN" &&
        ctx.session.user.id !== input.userId
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not allowed to upload a file",
        });
      }
      const userId = input.userId;
      const document = await ctx.prisma.userDocument.create({
        data: {
          userId,
          documentType: input.documentType,
        },
      });
      const presigned = await createPresignedPost(s3, {
        Bucket,
        Key: `${userId}/${document.id}`,
        Conditions: [
          // ["starts-with", "$Content-Type", "image/"],
          ["eq", "$Content-Type", input.fileType],
          ["content-length-range", 0, input.maxSize],
        ],
        Expires: 600,
      });
      return { ...presigned, documentId: document.id };
    }),
  getDocumentsForUser: protectedProcedure
    .input(
      z.object({
        userId: z.string().cuid(),
        documentType: z.nativeEnum(UserDocumentType).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (
        ctx.session.user.role !== "ADMIN" &&
        ctx.session.user.id !== input.userId
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not allowed to get these files",
        });
      }
      const documents = await ctx.prisma.userDocument.findMany({
        where: {
          userId: input.userId,
          documentType: input.documentType ?? undefined,
        },
      });
      const extendedDocuments: DocMetadata[] = await Promise.all(
        documents.map(async (doc) => ({
          ...doc,
          url: await getSignedUrl(
            s3,
            new GetObjectCommand({
              Bucket,
              Key: `${input.userId}/${doc.id}`,
            })
          ),
        }))
      );
      return extendedDocuments;
    }),
});
