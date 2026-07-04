import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getR2Config } from "./r2.config";
import { getR2Client } from "./r2.client";

export async function deleteFromR2(key: string) {
  const config = getR2Config();

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    }),
  );
}
