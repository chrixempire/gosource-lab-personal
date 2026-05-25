import { BadRequestException } from '@nestjs/common';
import { assertPhoneNumberAvailable, normalizePhoneNumber } from './phone.util';

describe('phone.util', () => {
  describe('normalizePhoneNumber', () => {
    it('strips non-digits', () => {
      expect(normalizePhoneNumber('+234 803 123 4567')).toBe('2348031234567');
      expect(normalizePhoneNumber('08031234567')).toBe('08031234567');
    });
  });

  describe('assertPhoneNumberAvailable', () => {
    const employeeModel = {
      find: jest.fn(),
    } as any;
    const businessModel = {
      find: jest.fn(),
    } as any;

    beforeEach(() => {
      jest.clearAllMocks();
      employeeModel.find.mockReturnValue({ select: () => ({ lean: async () => [] }) });
      businessModel.find.mockReturnValue({ select: () => ({ lean: async () => [] }) });
    });

    it('throws when another employee has the same normalized phone', async () => {
      employeeModel.find.mockReturnValue({
        select: () => ({
          lean: async () => [{ _id: 'emp1', phoneNumber: '+234 803 111 2222' }],
        }),
      });

      await expect(
        assertPhoneNumberAvailable('08031112222', { employeeModel, businessModel }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when a business account has the same normalized phone', async () => {
      businessModel.find.mockReturnValue({
        select: () => ({
          lean: async () => [{ _id: 'biz1', phoneNumber: '08039998888' }],
        }),
      });

      await expect(
        assertPhoneNumberAvailable('+2348039998888', { employeeModel, businessModel }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows the same phone when excluded business id matches', async () => {
      businessModel.find.mockReturnValue({
        select: () => ({
          lean: async () => [{ _id: 'biz1', phoneNumber: '08039998888' }],
        }),
      });

      await expect(
        assertPhoneNumberAvailable('08039998888', { employeeModel, businessModel }, {
          businessId: 'biz1',
        }),
      ).resolves.toBeUndefined();
    });
  });
});
