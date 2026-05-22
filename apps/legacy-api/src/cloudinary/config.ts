import { config } from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME_PROD,
  api_key: process.env.CLOUDINARY_API_KEY_PROD,
  api_secret: process.env.CLOUDINARY_API_SECRET_PROD,
});

export { cloudinary };
