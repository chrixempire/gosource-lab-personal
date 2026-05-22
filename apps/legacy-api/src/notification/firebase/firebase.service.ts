import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Logger } from '@nestjs/common';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  logger = new Logger(FirebaseService.name);

  onModuleInit() {
    let serviceAccount: any;

    // Try loading from file system
    if (!serviceAccount) {
      const possiblePaths = [
        join(
          process.cwd(),
          'src',
          'notification',
          'firebase',
          'gosource-fcm.json',
        ),
        join(
          process.cwd(),
          'dist',
          'notification',
          'firebase',
          'gosource-fcm.json',
        ),
        join(process.cwd(), 'notification', 'firebase', 'gosource-fcm.json'),
      ];

      for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
          try {
            const fileContent = fs.readFileSync(path, 'utf8');
            serviceAccount = JSON.parse(fileContent);
            this.logger.log(`Loaded Firebase service account from: ${path}`);
            break;
          } catch (error) {
            this.logger.error(
              `Failed to parse service account file at ${path}:`,
              error,
            );
          }
        }
      }
    }

    if (serviceAccount) {
      try {
        if (admin.apps.length === 0) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
        }
      } catch (error) {
        this.logger.error('Failed to initialize Firebase Admin:', error);
      }
    } else {
      this.logger.warn(
        'Firebase service account not found. Push notifications will be disabled.',
      );
    }
  }

  async sendPushNotification(
    token: string,
    title: string,
    body: string,
    image?: string,
    data?: any,
  ) {
    if (admin.apps.length === 0) {
      return { success: false, message: 'Firebase Admin not initialized' };
    }

    const message = {
      ...this.formMessageData(title, body, image),
      data: data || {},
      token: token,
    };

    try {
      const response = await admin.messaging().send(message as any);
      return { success: true, response };
    } catch (error) {
      this.logger.error('Error sending push notification:', error);
      return { success: false, error };
    }
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    image?: string,
    data?: any,
  ) {
    if (admin.apps.length === 0) {
      return { success: false, message: 'Firebase Admin not initialized' };
    }

    const message = {
      ...this.formMessageData(title, body, image),
      data: data || {},
      topic: topic,
    };

    try {
      const response = await admin.messaging().send(message as any);
      return { success: true, response };
    } catch (error) {
      this.logger.error('Error sending push notification to topic:', error);
      return { success: false, error };
    }
  }

  async sendMulticast(
    tokens: string[],
    title: string,
    body: string,
    image?: string,
    data?: any,
  ) {
    if (admin.apps.length === 0) {
      return { success: false, message: 'Firebase Admin not initialized' };
    }

    if (!tokens || tokens.length === 0) {
      return { success: false, message: 'No tokens provided' };
    }

    const message = {
      ...this.formMessageData(title, body, image),
      data: data || {},
      tokens: tokens,
    };

    try {
      const response = await admin
        .messaging()
        .sendEachForMulticast(message as any);
      return { success: true, response };
    } catch (error) {
      this.logger.error('Error sending multicast push notification:', error);
      return { success: false, error };
    }
  }

  formMessageData(title: string, body: string, image?: string) {
    const notification = {
      title,
      body,
      image,
    };
    return {
      notification,
      android: {
        collapseKey: 'Gosource',
        priority: 'high',
        ttl: 600000,
        notification: {
          ...notification,
        },
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title,
              body,
              launchImage: image,
            },
            badge: 1,
          },
        },
      },
      webpush: {
        notification: {
          title,
          body,
        },
      },
    };
  }
}
