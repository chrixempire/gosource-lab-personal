import { HttpException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import * as dotenv from 'dotenv';
import { TermiiData } from './interface/termii-data.interface';

dotenv.config();

const requestConfig = {
  headers: {
    'Accept-Encoding': 'gzip,deflate,compress',
  },
};

@Injectable()
export class TermiiService {
  constructor(private httpService: HttpService) {}

  /**
   * Send sms
   *
   * @param details
   * @returns {object}
   */

  async sendSms(details: any): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService
        .post(`${process.env.TERMII_URL}/sms/send`, details, requestConfig)
        .pipe(
          catchError((err) => {
            throw new HttpException(
              {
                statusCode: err.response.status,
                message: err.response.data.message,
              },
              err.response.status,
            );
          }),
        ),
    );
    return data;
  }

  /**
   * Send Phone number verification SMS
   *
   * @param details
   * @returns {object}
   */
  async sendPhoneNumberVerificationRequest(details: any): Promise<any> {
    const termiiData: TermiiData = {
      api_key: process.env.TERMII_API_KEY,
      to: details.phoneNumber,
      from: process.env.TERMII_SENDER_ID,
      type: 'plain',
      channel: 'dnd',
      sms: `Your GoSource confirmation code is ${details.code}. It expires in 5 minutes`,
    };

    const config = {
      headers: {
        'Accept-Encoding': 'gzip,deflate,compress',
      },
    };

    const { data } = await firstValueFrom(
      this.httpService
        .post(`${process.env.TERMII_URL}/sms/send`, termiiData, config)
        .pipe(
          catchError((err) => {
            throw new HttpException(
              {
                statusCode: err.response.data.status,
                message: err.response.data.message,
              },
              err.response.data.status,
            );
          }),
        ),
    );
    return data;
  }
}
