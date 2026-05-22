import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SystemConfig, SystemConfigDocument } from './schema/systemConfig.schema';
import { successResponse } from '../../utils/responses';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectModel(SystemConfig.name)
    private systemConfigModel: Model<SystemConfigDocument>,
  ) {}

  async getConfigs() {
    const configs = await this.systemConfigModel.find();
    return successResponse('Configurations fetched successfully', configs);
  }

  async getConfigByKey(key: string) {
    const config = await this.systemConfigModel.findOne({ key });
    if (!config) {
      return null;
    }
    return config;
  }

  async updateConfig(key: string, value: any, description?: string) {
    const config = await this.systemConfigModel.findOneAndUpdate(
      { key },
      { value, description },
      { new: true, upsert: true },
    );
    return successResponse('Configuration updated successfully', config);
  }

  async deleteConfig(key: string) {
    const result = await this.systemConfigModel.deleteOne({ key });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Configuration not found');
    }
    return successResponse('Configuration deleted successfully');
  }
}
