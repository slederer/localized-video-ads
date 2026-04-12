import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  adAssetUploader: f({
    image: { maxFileSize: "8MB", maxFileCount: 5 },
    video: { maxFileSize: "64MB", maxFileCount: 2 },
  }).onUploadComplete(async ({ file }) => {
    return { url: file.ufsUrl };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
