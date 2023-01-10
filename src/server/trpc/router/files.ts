import { type UserDocument, UserDocumentType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../trpc";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "@root/src/env/server.mjs";

const s3 = new S3Client({
  region: "eu-west-3",
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID_WSC ?? "",
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY_WSC ?? "",
  },
});

const Bucket = "videoach-dev";
//process.env.NODE_ENV === "production" ? "videoach-prod" : "videoach-dev";

export async function createPost(
  key: string,
  fileType: string,
  maxSize: number = 1024 * 1024
) {
  return await createPresignedPost(s3, {
    Bucket,
    Key: key,
    Conditions: [
      // ["starts-with", "$Content-Type", "image/"],
      ["eq", "$Content-Type", fileType],
      ["content-length-range", 0, maxSize],
    ],
    Expires: 600,
  });
}

export async function getDocUrl(userId: string, documentId: string) {
  return await getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket,
      Key: `${userId}/${documentId}`,
    })
  );
}

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
        fileName: z.string(),
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
          fileType: input.fileType,
          fileName: input.fileName,
        },
      });
      const presigned = await createPost(
        `${userId}/${document.id}`,
        input.fileType,
        input.maxSize
      );
      return { ...presigned, documentId: document.id };
    }),
  getDocumentUrlById: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      if (!input) return { url: "", fileype: "" };
      const document = await ctx.prisma.userDocument.findUnique({
        where: {
          id: input,
        },
      });
      if (!document)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This document does not exist",
        });
      const url = await getDocUrl(document.userId, document.id);
      return { url, fileType: document.fileType };
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
          url: await getDocUrl(input.userId, doc.id),
        }))
      );
      return extendedDocuments;
    }),
  deleteUserDocument: protectedProcedure
    .input(
      z.object({ userId: z.string().cuid(), documentId: z.string().cuid() })
    )
    .mutation(async ({ ctx, input }) => {
      if (
        ctx.session.user.role !== "ADMIN" &&
        ctx.session.user.id !== input.userId
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You are not allowed to delete this file",
        });
      }

      const command = new DeleteObjectCommand({
        Bucket,
        Key: `${input.userId}/${input.documentId}`,
      });
      await s3.send(command);
      return ctx.prisma.userDocument.delete({
        where: { id: input.documentId },
      });
    }),
});
