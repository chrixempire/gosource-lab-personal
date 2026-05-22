import { HttpStatus } from '@nestjs/common';

export const validationErrorResponse = (res, message: string[]) => {
  const status = HttpStatus.BAD_REQUEST;
  const error = 'Bad Request';

  const errorObj = {
    statusCode: status,
    error,
  };

  if (message && message.length > 0) {
    errorObj['message'] = message;
  }

  return res.status(status).json(errorObj);
};

export interface ApiResponse<T> {
  status: boolean;
  message: string;
  data?: T;
}

export const successResponse = <T>(
  message: string,
  data?: T,
): ApiResponse<T> => {
  return {
    status: true,
    message,
    data,
  };
};
