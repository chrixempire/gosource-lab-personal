import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import {
  AdminMessageAudience,
  AdminMessageStatus,
  AdminMessageType,
} from './enum/message.enum';
import { AdminMessagingService } from './messaging.service';

describe('AdminMessagingService', () => {
  const messageModel = {
    exists: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    updateMany: jest.fn(),
    countDocuments: jest.fn(),
  };
  const customerModel = { find: jest.fn() };
  const emailQueue = { addBulk: jest.fn() };

  let service: AdminMessagingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AdminMessagingService(
      messageModel as any,
      customerModel as any,
      emailQueue as any,
    );
  });

  it('creates the first alert as active', async () => {
    messageModel.exists.mockResolvedValue(null);
    messageModel.create.mockImplementation(async (value) => ({
      _id: new Types.ObjectId(),
      ...value,
    }));

    const response = await service.create({
      type: AdminMessageType.ALERT,
      message: 'Scheduled maintenance',
      startDate: '2026-06-20',
      endDate: '2026-06-21',
      theme: '#D97706',
    });

    expect(messageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: AdminMessageStatus.ACTIVE }),
    );
    expect(response.status).toBe(true);
  });

  it('snapshots all active customers and queues an email for each one', async () => {
    const recipients = [
      customer('Ada', 'ada@example.com'),
      customer('Tunde', 'tunde@example.com'),
    ];
    customerModel.find.mockResolvedValue(recipients);
    messageModel.create.mockImplementation(async (value) =>
      messageDocument(value),
    );
    emailQueue.addBulk.mockResolvedValue([]);

    await service.create({
      type: AdminMessageType.EMAIL,
      subject: 'New products',
      message: 'Fresh products are available.',
      users: ['all'],
    });

    expect(messageModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        audience: AdminMessageAudience.ALL,
        recipientCount: 2,
        status: AdminMessageStatus.PENDING,
      }),
    );
    expect(emailQueue.addBulk).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({ recipientEmail: 'ada@example.com' }),
        }),
        expect.objectContaining({
          data: expect.objectContaining({
            recipientEmail: 'tunde@example.com',
          }),
        }),
      ]),
    );
  });

  it('resends a sent email to all original active recipients', async () => {
    const recipient = customer('Ada', 'ada@example.com');
    const message = messageDocument({
      type: AdminMessageType.EMAIL,
      status: AdminMessageStatus.SENT,
      subject: 'Original subject',
      message: 'Original message',
      users: [recipient._id],
      recipientCount: 1,
      deliveredCount: 1,
      failedCount: 0,
      resendCount: 0,
    });
    messageModel.findById.mockResolvedValue(message);
    customerModel.find.mockResolvedValue([recipient]);
    emailQueue.addBulk.mockResolvedValue([]);

    await service.resend(message._id.toString());

    expect(message.resendCount).toBe(1);
    expect(message.status).toBe(AdminMessageStatus.PENDING);
    expect(message.save).toHaveBeenCalled();
    expect(emailQueue.addBulk).toHaveBeenCalledTimes(1);
  });

  it('does not allow editing an email message', async () => {
    const message = messageDocument({
      type: AdminMessageType.EMAIL,
      status: AdminMessageStatus.SENT,
    });
    messageModel.findById.mockResolvedValue(message);

    await expect(
      service.updateAlert(message._id.toString(), {
        message: 'Changed',
        startDate: '2026-06-20',
        endDate: '2026-06-21',
        theme: '#D97706',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

function customer(firstName: string, email: string) {
  return {
    _id: new Types.ObjectId(),
    firstName,
    lastName: 'Customer',
    businessName: `${firstName} Stores`,
    email,
  };
}

function messageDocument(values: Record<string, any>): any {
  return {
    _id: new Types.ObjectId(),
    recipientCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    resendCount: 0,
    users: [],
    save: jest.fn().mockResolvedValue(undefined),
    deleteOne: jest.fn().mockResolvedValue(undefined),
    ...values,
  };
}
