import * as Joi from 'joi';

export const validateSignupRequest = Joi.object()
  .options({ abortEarly: false })
  .keys({
    email: Joi.string().trim().required(),
    businessName: Joi.string().trim().required(),
  });

export const validateLoginRequest = Joi.object()
  .options({ abortEarly: false })
  .keys({
    email: Joi.string().trim().required(),
    password: Joi.string().trim().required(),
  });

export const validateOtpRequest = Joi.object()
  .options({ abortEarly: false })
  .keys({
    email: Joi.string().trim().required(),
    otp: Joi.string().trim().required(),
  });

export const validateResendOtpRequest = Joi.object()
  .options({ abortEarly: false })
  .keys({
    email: Joi.string().trim().required(),
  });

export const validateAccountSetupRequest = Joi.object()
  .options({ abortEarly: false })
  .keys({
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().required(),
    role: Joi.string().trim().optional(),
    password: Joi.string().trim().required(),
    email: Joi.string().trim().required(),
    phoneNumber: Joi.string().trim().required(),
  });
