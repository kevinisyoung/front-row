export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// Validate environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_R2_ACCESS_KEY_ID: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID,
  NEXT_PUBLIC_R2_SECRET_ACCESS_KEY: process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY,
  NEXT_PUBLIC_R2_ENDPOINT: process.env.NEXT_PUBLIC_R2_ENDPOINT,
  NEXT_PUBLIC_R2_BUCKET_NAME: process.env.NEXT_PUBLIC_R2_BUCKET_NAME
};

// Check for missing environment variables
const missingEnvVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY!
  }
});

export async function POST(request: Request) {
  try {
    const { files, spaceId } = await request.json();

    if (!files?.length) {
      return NextResponse.json({ error: 'No files specified' }, { status: 400 });
    }

    const presignedUrls = await Promise.all(
      files.map(async (file: { name: string; contentType: string }) => {
        const key = `${spaceId || 'default'}/${file.name}`;
        const command = new PutObjectCommand({
          Bucket: process.env.NEXT_PUBLIC_R2_BUCKET_NAME,
          Key: key,
          ContentType: file.contentType || 'application/octet-stream',
          ACL: 'public-read'
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        return url;
      })
    );

    return NextResponse.json({ presignedUrls });

  } catch (error) {
    console.error('Error generating presigned URLs:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URLs' },
      { status: 500 }
    );
  }
} 