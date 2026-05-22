import { Injectable } from '@nestjs/common';
import { ActivityLog, ActivityLogDocument } from './schema/activityLog.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { FilterActivityDto } from './dto/filter-activity.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(ActivityLog.name) private activityModel: Model<ActivityLog>,
  ) {}

  async findAll(queryParams: FilterActivityDto): Promise<any> {
    const filterDto = Object.assign(new FilterActivityDto(), queryParams);
    let filter = filterDto.buildQueryCondition();
    const { limit = 200, page = 1, filterBy, filterValue, id } = filterDto;

    if (id) {
      filter = {
        $expr: {
          $regexMatch: {
            input: { $toString: '$_id' },
            regex: id,
            options: 'i',
          },
        },
      };
    } else if (filterBy && filterValue) {
      filter = { [filterBy]: filterValue };
    }

    const [totalDocuments] = await Promise.all([
      this.activityModel.countDocuments(filter).exec(),
    ]);

    const activitys: ActivityLogDocument[] = await this.activityModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    return {
      status: true,
      message: 'Activities retrieved successfully',
      data: {
        totalDocuments,
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
        activitys,
      },
    };
  }
}
