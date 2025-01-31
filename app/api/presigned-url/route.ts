export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand } from "@aws-sdk/client-s3";

if (!process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_ENDPOINT || !process.env.R2_BUCKET_NAME) {
  throw new Error('Missing R2 credentials');
} 

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
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
        const key = `${spaceId}/${file.name}`;
        const command = new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          ContentType: file.contentType || 'application/octet-stream',
          ACL: 'public-read'
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        console.log('Generated presigned URL:', url); // Debug log
        return url;
      })
    );

    console.log('Returning presigned URLs:', presignedUrls); // Debug log
    return NextResponse.json({ presignedUrls });

  } catch (error) {
    console.error('Error generating presigned URLs:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URLs' },
      { status: 500 }
    );
  }
} 