import { type UserDocumentType } from "@prisma/client";
import { trpc } from "@trpcclient/trpc";

export const useWriteFile = (
  file: File | undefined,
  userId: string,
  documentType: UserDocumentType
) => {
  const createPresignedUrl =
    trpc.files.createPresignedUrl.useMutation().mutateAsync;

  async function writeFile() {
    if (!file) return undefined;
    const { url, fields, documentId } = await createPresignedUrl({
      userId,
      fileType: file.type,
      documentType,
      fileName: file.name,
    });
    const formData = new FormData();
    formData.append("Content-Type", file.type);
    Object.entries(fields).forEach(([k, v]) => {
      formData.append(k, v);
    });
    formData.append("file", file);

    await fetch(url, {
      method: "POST",
      body: formData,
    });
    return documentId;
  }
  return writeFile;
};
