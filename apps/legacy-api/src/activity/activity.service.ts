import { Injectable } from '@nestjs/common';
import { ActivityLog } from './schema/activityLog.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { FilterActivityDto } from './dto/filter-activity.dto';
import { AdminUser } from '../admin/auth/schema/adminUser.schema';
import { BusinessCustomer } from '../business/schema/business.schema';
import { INITIATOR_TYPE } from './interface/activityLog.interface';

@Injectable()
export class ActivityService {
  constructor(
    @InjectModel(ActivityLog.name) private activityModel: Model<ActivityLog>,
    @InjectModel(AdminUser.name) private adminUserModel: Model<AdminUser>,
    @InjectModel(BusinessCustomer.name)
    private businessModel: Model<BusinessCustomer>,
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

    const activitys: any[] = await this.activityModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();

    const enriched = await this.enrichInitiators(activitys);

    return {
      status: true,
      message: 'Activities retrieved successfully',
      data: {
        totalDocuments,
        page,
        limit,
        totalPages: Math.ceil(totalDocuments / limit),
        activitys: enriched,
      },
    };
  }

  /**
   * Resolve the live name/role/email of each log's initiator. Admin and
   * business initiators are looked up in their respective collections; the
   * name/role snapshot captured at log time is used as a fallback (e.g. when
   * the initiating account has since been deleted).
   */
  private async enrichInitiators(activitys: any[]): Promise<any[]> {
    const initiatorIds = Array.from(
      new Set(
        activitys
          .map((activity) => activity.initiator)
          .filter(Boolean)
          .map((value) => String(value)),
      ),
    );

    if (initiatorIds.length === 0) {
      return activitys;
    }

    const [admins, businesses] = await Promise.all([
      this.adminUserModel
        .find({ _id: { $in: initiatorIds } })
        .select('firstName lastName email roleId')
        .populate({ path: 'roleId', select: 'name' })
        .lean()
        .exec(),
      this.businessModel
        .find({ _id: { $in: initiatorIds } })
        .select('businessName email role')
        .lean()
        .exec(),
    ]);

    const adminMap = new Map(admins.map((admin) => [String(admin._id), admin]));
    const businessMap = new Map(
      businesses.map((business) => [String(business._id), business]),
    );

    return activitys.map((activity) => {
      const idStr = activity.initiator ? String(activity.initiator) : null;
      let initiatorName: string | null = activity.initiatorName ?? null;
      let initiatorRole: string | null = activity.initiatorRole ?? null;
      let initiatorEmail: string | null = null;

      if (idStr) {
        const admin = adminMap.get(idStr) as any;
        const business = businessMap.get(idStr) as any;

        if (admin) {
          const fullName = `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim();
          initiatorName = fullName || initiatorName;
          initiatorRole = admin.roleId?.name ?? initiatorRole;
          initiatorEmail = admin.email ?? null;
        } else if (business) {
          initiatorName = business.businessName ?? initiatorName;
          initiatorRole = business.role ?? initiatorRole;
          initiatorEmail = business.email ?? null;
        }
      }

      return {
        ...activity,
        initiatorType: activity.initiatorType ?? INITIATOR_TYPE.ADMIN,
        initiatorName,
        initiatorRole,
        initiatorEmail,
      };
    });
  }
}
