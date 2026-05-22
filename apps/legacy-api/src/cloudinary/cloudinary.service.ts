import { Injectable } from '@nestjs/common';
import { formatBufferToBase64 } from '../utils/helpers';
import { cloudinary } from './config';

@Injectable()
export class CloudinaryService {
  async uploadImageToCloudinary(file: any) {
    const image = await formatBufferToBase64(file);
    return await cloudinary.uploader.upload(image.content, {
      folder: 'gosource',
    });
  }

  async uploadImageUrlToCLoudinary(imageUrl: string) {
    return await cloudinary.uploader.upload(imageUrl, {
      folder: 'gosource',
    });
  }

  async uploadStatementToCloudinary(file: any) {
    const image = await formatBufferToBase64(file);
    return await cloudinary.uploader.upload(image.content, {
      folder: 'gosource',
      resource_type: 'raw',
    });
  }
}
