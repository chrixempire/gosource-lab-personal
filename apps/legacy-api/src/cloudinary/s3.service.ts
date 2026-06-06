import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  DeleteObjectCommand,
  HeadObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { s3Client } from '../s3Client';

@Injectable()
export class S3Service {
  private s3: S3;
  private bucketName: string;
  private endpoint: string;

  constructor() {
    this.bucketName = process.env.CDN_BUCKET_NAME;
    this.endpoint = `https://${process.env.CDN_BUCKET_NAME}.${process.env.CDN_URL}`;

    this.s3 = s3Client;
  }

  async uploadFile(
    file: Express.Multer.File,
    compressImages = true,
  ): Promise<{ key: string; url: string }> {
    const randomString = Math.random().toString(36).substring(2, 15);
    const key = `${randomString}-${file.originalname}`;

    try {
      let fileBuffer = file.buffer;

      if (compressImages && this.isImageFile(file)) {
        try {
          fileBuffer = await sharp(file.buffer)
            .jpeg({
              quality: 80,
              progressive: true,
              mozjpeg: true,
            })
            .toBuffer();
        } catch (compressionError) {
          console.warn(
            'Image compression failed, using original file:',
            compressionError.message,
          );
          fileBuffer = file.buffer;
        }
      }

      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: fileBuffer,
        ACL: 'public-read' as ObjectCannedACL,
      };

      await this.s3.send(new PutObjectCommand(params));

      `https://${process.env.CDN_BUCKET_NAME}.${process.env.CDN_URL}/${params.Key}`;

      return {
        key,
        url: `${this.endpoint}/${key}`,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      throw new Error(
        `Failed to delete file from DigitalOcean Spaces: ${error.message}`,
      );
    }
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );
      return true;
    } catch (error) {
      if (error.name === 'NotFound') {
        return false;
      }
      throw new NotFoundException(`File with key ${key} not found`);
    }
  }

  async listFiles(prefix: string = ''): Promise<string[]> {
    try {
      const response = await this.s3.listObjectsV2({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      return response.Contents.map((item) => item.Key);
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  private isImageFile(file: Express.Multer.File): boolean {
    return file.mimetype.startsWith('image/');
  }
}
