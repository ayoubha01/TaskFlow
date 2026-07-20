import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import { env } from "../config/env.js";
import { prisma } from "../config/db.js";

const LOCAL_UPLOADS_DIR = path.resolve("uploads");

async function ensureLocalDir() {
  await fs.mkdir(LOCAL_UPLOADS_DIR, { recursive: true });
}

/**
 * Stores a file and records it against a task.
 * Swaps transparently between local disk (dev) and S3 (prod) based on env.uploadsBucket.
 */
export async function storeAttachment({ taskId, fileName, buffer }) {
  const key = `${uuid()}-${fileName}`;

  if (env.uploadsBucket) {
    await uploadToS3(key, buffer);
  } else {
    await ensureLocalDir();
    await fs.writeFile(path.join(LOCAL_UPLOADS_DIR, key), buffer);
  }

  return prisma.attachment.create({
    data: {
      taskId,
      fileName,
      s3Key: key,
      fileSize: buffer.length,
    },
  });
}

export async function getAttachmentUrl(attachment) {
  if (env.uploadsBucket) {
    return getSignedS3Url(attachment.s3Key);
  }
  return `/uploads/${attachment.s3Key}`;
}

// --- S3 implementation, lazy-loaded so local dev doesn't need the AWS SDK installed ---

async function uploadToS3(key, buffer) {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({ region: env.awsRegion });
  await client.send(
    new PutObjectCommand({
      Bucket: env.uploadsBucket,
      Key: key,
      Body: buffer,
    })
  );
}

async function getSignedS3Url(key) {
  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
  const client = new S3Client({ region: env.awsRegion });
  const command = new GetObjectCommand({ Bucket: env.uploadsBucket, Key: key });
  return getSignedUrl(client, command, { expiresIn: 3600 });
}