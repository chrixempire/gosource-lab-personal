import { Injectable, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, catchError } from 'rxjs';

@Injectable()
export class IdentitypassService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Send request to verify BVN.
   *
   * @param bvnDetails
   * @returns {object}
   */
  async sendBvnVerificationRequest(bvnDetails: any): Promise<any> {
    const config = {
      headers: {
        'Accept-Encoding': 'gzip,deflate,compress',
        'x-api-key': process.env.IDENTITY_PASS_SECRET_KEY,
        'app-id': process.env.IDENTITY_PASS_APP_KEY,
      },
    };

    const details = {
      number: bvnDetails.bvn,
    };

    const { data } = await firstValueFrom(
      this.httpService
        .post(
          `${process.env.IDENTITY_PASS_BASE_URL}/identitypass/verification/bvn`,
          details,
          config,
        )
        .pipe(
          catchError((err) => {
            console.error(err, 'ID PASS BVN ERROR');
            throw err;
          }),
        ),
    );

    if (data.status == false) {
      throw new NotFoundException(data.message);
    }

    return data.data;
  }
}
