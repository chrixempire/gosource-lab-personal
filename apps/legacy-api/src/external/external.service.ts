import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class ExternalService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Send POST request
   *
   * @param url
   * @param payload
   * @returns {object}
   */
  async post(url: string, payload: any, config: any): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService.post(url, payload, config).pipe(
        catchError((error) => {
          throw error;
        }),
      ),
    );
    return data;
  }

  /**
   * Send GET request.
   *
   * @param url
   * @returns {object}
   */
  async get(url: string, config: any): Promise<any> {
    const { data } = await firstValueFrom(
      this.httpService.get(url, config).pipe(
        catchError((error) => {
          throw error;
        }),
      ),
    );
    return data;
  }
}
