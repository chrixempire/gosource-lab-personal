import { BadRequestException } from '@nestjs/common';

export const multerOptions = {
  // file size limits
  limits: {
    fileSize: 8000000,
  },
  // Check the file types allowed
  imageFilter: (req: any, file: any, imageFilterCallback: any) => {
    if (file.fieldname === 'images') {
      if (!file.originalname.match(/\.(jpg|jpeg|png|svg)$/i)) {
        return imageFilterCallback(
          new BadRequestException('Please upload a valid image'),
        );
      }
      return imageFilterCallback(null, true);
    } else if (file.fieldname === 'bankStatement') {
      if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|docx)$/i)) {
        return imageFilterCallback(
          new BadRequestException(
            'Please upload a valid file (jpg, jpeg, png, pdf, or docx)',
          ),
        );
      }
      return imageFilterCallback(null, true);
    } else if (file.fieldname === 'identity') {
      if (!file.originalname.match(/\.(jpg|jpeg|png|pdf|docx)$/i)) {
        return imageFilterCallback(
          new BadRequestException(
            'Please upload a valid file (jpg, jpeg, png, pdf, or docx)',
          ),
        );
      }
      return imageFilterCallback(null, true);
    }
  },
};
