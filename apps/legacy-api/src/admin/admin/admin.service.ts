import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { AdminUser, AdminUserDocument } from '../auth/schema/adminUser.schema';
import { Model } from 'mongoose';
import { AdminRole } from '../auth/schema/adminRole.schema';
import {
  AdminUserRole,
  AdminUserRoleDocument,
} from '../auth/schema/adminUserRole.schema';
import { Product } from '../../product/entities/product.entity';
import { Order } from '../../order/entities/order.entity';
import { BusinessCustomer } from '../../business/schema/business.schema';
import { Request } from '../../request/schema/request.schema';
import { Employee } from '../../employee/entities/employee.entity';
import { Branch } from '../../branch/entities/branch.entity';
import { Category } from '../../category/entities/category.entity';
import { successResponse } from '../../utils/responses';
import { SearchAdminsDto } from './dto/search-admins.dto';
import { Role } from '../role/entities/role.entity';
import {
  ChangePasswordDto,
  UpdateProfileDto,
  UpdateProfileSuperAdminDto,
} from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
import { AdminAccountStatus } from '../auth/enum/admin.enum';
import { ActivityService } from '../../activity/activity.service';
import { adminInitiator } from '../../utils/activity-initiator.util';
import { ACTIVITY_LOG_ACTION_TYPE } from '../../activity/interface/activityLog.interface';
import { buildChanges, describeChanges } from '../../utils/activity-changes.util';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(AdminUser.name)
    private adminUserModel: Model<AdminUser>,
    @InjectModel(Role.name) private roleModel: Model<Role>,
    @InjectModel(AdminRole.name)
    private adminRoleModel: Model<AdminRole>,
    @InjectModel(AdminUserRole.name)
    private adminUserRoleModel: Model<AdminUserRole>,
    @InjectModel(Product.name)
    private productModel: Model<Product>,
    @InjectModel(Order.name)
    private orderModel: Model<Order>,
    @InjectModel(BusinessCustomer.name)
    private customerModel: Model<BusinessCustomer>,
    @InjectModel(Request.name)
    private requestModel: Model<Request>,
    @InjectModel(Employee.name)
    private employeeModel: Model<Employee>,
    @InjectModel(Branch.name)
    private branchModel: Model<Branch>,
    @InjectModel(Category.name)
    private categoryModel: Model<Category>,
    private readonly activityService: ActivityService,
  ) {}

  /**
   * Get all admins.
   *
   * @returns {object}
   */
  async getAdmins(): Promise<any> {
    const admins: AdminUserDocument[] = await this.adminUserModel
      .find()
      .populate('roleId');

    // Get roles for each admin
    const resolvedAdmins = admins.map((admin) => {
      const { roleId, ...adminDetails } = admin.toObject() as any;

      return {
        ...adminDetails,
        role: roleId?.name,
      };
    });

    return successResponse('Admins fetched successfully', resolvedAdmins);
  }

  /**
   * Get admin by id.
   *
   * @param adminId
   * @returns {object}
   */
  async getSingleAdmin(adminId: string): Promise<any> {
    const admin: any = await this.adminUserModel
      .findById(adminId)
      .populate('roleId');

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const { roleId, ...rest } = admin.toObject() as Record<string, unknown>;

    return successResponse('Admin fetched successfully', {
      ...rest,
      role: (roleId as { name?: string } | null | undefined)?.name,
    });
  }

  /**
   * Super admin access to update members profile
   * @param id
   * @param body
   * @returns {object}
   */
  async updateProfileBySuperAdmin(
    id: string,
    body: UpdateProfileSuperAdminDto,
    admin?: any,
  ) {
    if (body.roleId) {
      const roleDetails = await this.roleModel.findById(body.roleId);

      if (!roleDetails) {
        throw new NotFoundException('Role not found');
      }
    }

    const before: any = await this.adminUserModel
      .findById(id)
      .populate('roleId');

    const getAdmin: any = await this.adminUserModel
      .findByIdAndUpdate(id, body, {
        new: true,
      })
      .populate('roleId');

    if (!getAdmin) {
      throw new NotFoundException('Admin does not exist');
    }

    getAdmin.role = getAdmin?.roleId?.name;
    delete getAdmin.roleId;

    const changes = buildChanges(
      {
        firstName: before?.firstName,
        lastName: before?.lastName,
        phoneNumber: before?.phoneNumber,
        role: before?.roleId?.name,
        status: before?.status,
      },
      {
        firstName: getAdmin.firstName,
        lastName: getAdmin.lastName,
        phoneNumber: getAdmin.phoneNumber,
        role: getAdmin.role,
        status: getAdmin.status,
      },
      [
        { key: 'firstName', label: 'first name' },
        { key: 'lastName', label: 'last name' },
        { key: 'phoneNumber', label: 'phone number' },
        { key: 'role', label: 'role' },
        { key: 'status', label: 'status' },
      ],
    );
    await this.activityService.record({
      ...adminInitiator(admin),
      action: ACTIVITY_LOG_ACTION_TYPE.UPDATE,
      module: 'Admins',
      objectId: id,
      description: describeChanges(
        'admin',
        `${before?.firstName ?? ''} ${before?.lastName ?? ''}`.trim(),
        changes,
      ),
      metadata: { changes },
    });

    return successResponse('Profile updated successfully', getAdmin);
  }

  /**
   * Signed user access to update profile
   * @param id
   * @param body
   * @returns {object}
   */
  async updateProfile(id: string, body: UpdateProfileDto) {
    const getAdmin: any = await this.adminUserModel
      .findByIdAndUpdate(id, body, {
        new: true,
      })
      .populate('roleId');
    if (!getAdmin) {
      throw new NotFoundException('Admin does not exist');
    }

    getAdmin.role = getAdmin?.roleId?.name;
    delete getAdmin.roleId;

    return successResponse('Profile updated successfully', getAdmin);
  }

  async activateAdminAccount(id: string) {
    const admin = await this.adminUserModel.findById(id);

    if (!admin) {
      throw new NotFoundException('Admin does not exist');
    }

    if (admin.status === AdminAccountStatus.ACTIVE) {
      throw new BadRequestException('Admin already activated');
    }

    const getAdmin: any = await this.adminUserModel
      .findByIdAndUpdate(id, { status: AdminAccountStatus.ACTIVE })
      .populate('roleId');
    if (!getAdmin) {
      throw new NotFoundException('Admin does not exist');
    }

    getAdmin.role = getAdmin?.roleId?.name;
    delete getAdmin.roleId;
    return successResponse('User activated successfully', getAdmin);
  }

  async suspendAdminAccount(id: string) {
    const admin = await this.adminUserModel.findById(id);

    if (!admin) {
      throw new NotFoundException('Admin does not exist');
    }

    if (admin.status === AdminAccountStatus.SUSPENDED) {
      throw new BadRequestException('Admin already suspended');
    }

    const getAdmin: any = await this.adminUserModel
      .findByIdAndUpdate(id, { status: AdminAccountStatus.SUSPENDED })
      .populate('roleId');
    if (!getAdmin) {
      throw new NotFoundException('Admin does not exist');
    }

    getAdmin.role = getAdmin?.roleId?.name;
    delete getAdmin.roleId;
    return successResponse('User suspended successfully', getAdmin);
  }

  /**
   * Signed admin - change password
   * @param data
   * @param adminId
   * @returns
   */
  async changePassword(data: ChangePasswordDto, adminId: string): Promise<any> {
    const adminUser: AdminUserDocument = await this.adminUserModel
      .findById(adminId)
      .select('+password');

    if (!adminUser) throw new NotFoundException('Admin User not found');

    const hash = adminUser.password;
    const isMatch = await bcrypt.compare(data.oldPassword, hash);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid old password');
    }

    const salt = await bcrypt.genSalt();
    adminUser.password = await bcrypt.hash(data.newPassword, salt);
    adminUser.save();

    return successResponse('Password changed successfully');
  }

  /**
   * Change admin role status.
   *
   * @param adminId
   * @param statusDetails
   * @returns {object}
   */
  async changeAdminRoleStatus(
    adminId: string,
    statusDetails: any,
  ): Promise<any> {
    const admin: AdminUserDocument =
      await this.adminUserModel.findById(adminId);

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const adminRole = await this.adminUserRoleModel.findOne({
      adminId,
      roleId: statusDetails.roleId,
    });

    if (!adminRole) {
      throw new NotFoundException('Admin role not found');
    }

    adminRole.status = statusDetails.status;
    adminRole.save();

    return {
      status: true,
      message: 'Role status updated successfully',
      data: adminRole,
    };
  }

  async getStats() {
    const [
      orders,
      products,
      requests,
      customers,
      branches,
      employees,
      totalOrdersAmount,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      categories,
      outStock,
      inStock,
    ] = await Promise.all([
      this.orderModel.countDocuments(),
      this.productModel.countDocuments(),
      this.requestModel.countDocuments(),
      this.customerModel.countDocuments(),
      this.branchModel.countDocuments(),
      this.employeeModel.countDocuments(),
      this.orderModel.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$totalPrice' },
          },
        },
      ]),
      this.orderModel.countDocuments({
        status: { $in: ['pending', 'PENDING'] },
      }),
      this.orderModel.countDocuments({
        status: { $in: ['shipped', 'SHIPPED'] },
      }),
      this.orderModel.countDocuments({
        status: { $in: ['delivered', 'DELIVERED'] },
      }),
      this.categoryModel.countDocuments(),
      this.productModel.countDocuments({ inStock: false }),
      this.productModel.countDocuments({ inStock: true }),
    ]);

    return {
      status: true,
      message: 'Stats fetched successfully',
      data: {
        orders,
        products,
        requests,
        customers,
        branches,
        employees,
        pendingOrders,
        shippedOrders,
        deliveredOrders,
        categories,
        inStock,
        outStock,
        totalOrdersAmount:
          totalOrdersAmount.length > 0 ? totalOrdersAmount[0].totalAmount : 0,
      },
    };
  }

  /**
   * Search for admins by firstName with pagination.
   *
   * @returns {object}
   */
  async searchAdmins(searchParams: SearchAdminsDto): Promise<any> {
    const { name, page = 1, limit = 100 } = searchParams;

    const skip = (page - 1) * limit;

    // Build search filter
    const searchFilter: any = {};
    if (name && name.trim()) {
      searchFilter.firstName = {
        $regex: new RegExp(name.trim(), 'i'), // Case-insensitive search
      };
    }

    // Get total count for pagination
    const totalCount = await this.adminUserModel.countDocuments(searchFilter);

    // Fetch admins with pagination
    const admins: AdminUserDocument[] = await this.adminUserModel
      .find(searchFilter)
      .sort({ createdAt: -1 }) // Latest first
      .skip(skip)
      .limit(limit)
      .exec();

    // Get roles for each admin
    const adminsWithRoles = await Promise.all(
      admins.map(async (admin) => {
        const adminRoles: AdminUserRoleDocument[] =
          await this.adminUserRoleModel.find({ adminId: admin.id });

        const roles = await Promise.all(
          adminRoles.map(async (userRole) => {
            const role = await this.adminRoleModel.findById(userRole.roleId);
            return {
              id: role.id,
              role: role.name,
              status: userRole.status,
            };
          }),
        );

        return {
          id: admin.id,
          firstName: admin.firstName,
          lastName: admin.lastName,
          email: admin.email,
          createdAt: (admin as any).createdAt || admin._id.getTimestamp(),
          roles,
        };
      }),
    );

    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return successResponse('Admins fetched successfully', {
      admins: adminsWithRoles,
      meta: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage,
        hasPrevPage,
      },
    });
  }
}
