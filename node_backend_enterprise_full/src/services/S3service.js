import { S3Client, PutObjectCommand,GetObjectCommand  } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

/**
 * Uploads a log entry to S3
 * @param {string} bucketName - S3 bucket name
 * @param {string} logMessage - Log message or JSON string
 */
export async function uploadLogToS3(bucketName, logMessage) {
  const timestamp = new Date().toISOString();
  const key = `logs/${timestamp}-${uuidv4()}.log`;

  const params = {
    Bucket: bucketName,
    Key: key,
    Body: logMessage,
    ContentType: "text/plain"
  };

  try {
    const result = await s3.send(new PutObjectCommand(params));
    console.log(`✅ Log stored in S3 at key: ${key}`);
    return result;
  } catch (err) {
    console.error("❌ Error uploading log to S3:", err);
    throw err;
  }
}
export async function getImageUrl(bucketName, key) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key
  });

  // URL expires in 1 hour
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  return url;
}
