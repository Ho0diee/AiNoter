import { createUploadthing, type FileRouter, createRouteHandler } from "uploadthing/next"

const f = createUploadthing()

export const ourFileRouter = {
  gameZip: f({ "application/zip": { maxFileSize: "256MB" } })
    .middleware(async () => ({ userId: "anon" }))
    .onUploadComplete(async ({ file }) => ({ url: file.url })),

  imageThumb: f({ image: { maxFileSize: "8MB" } })
    .middleware(async () => ({ userId: "anon" }))
    .onUploadComplete(async ({ file }) => ({ url: file.url }))
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
export const { GET, POST } = createRouteHandler({ router: ourFileRouter })
