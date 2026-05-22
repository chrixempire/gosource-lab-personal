import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Role, RoleDocument } from './entities/role.entity';
import { Model, Types } from 'mongoose';
import { RequiredPermission } from './enum/required-permission';
import { successResponse } from '../../utils/responses';
import { AdminUser } from '../auth/schema/adminUser.schema';
import { GroupedPermissions } from './groupedPermissions';

@Injectable()
export class RoleService {
  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<Role>,
    @InjectModel(AdminUser.name)
    private readonly adminUserModel: Model<AdminUser>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const roleExists = await this.roleModel.findOne({
      name: createRoleDto.name,
    });
    if (roleExists) {
      throw new ConflictException('Role already exists');
    }

    // Remove duplicate permissions
    const uniquePermissions = [...new Set(createRoleDto.permissions)];
    createRoleDto.permissions = uniquePermissions;

    if (createRoleDto.permissions.length === 0) {
      throw new BadRequestException('Role must have at least one permission');
    }
    if (
      createRoleDto.permissions.some(
        (permission) => !Object.values(RequiredPermission).includes(permission),
      )
    ) {
      throw new UnprocessableEntityException('Invalid permission provided');
    }

    const newRole = await this.roleModel.create(createRoleDto);
    return successResponse('Role created successfully', newRole);
  }

  async findAll() {
    const roles = await this.roleModel
      .aggregate([
        {
          $lookup: {
            from: 'adminusers',
            let: { roleId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $eq: ['$roleId', '$$roleId'],
                  },
                },
              },
            ],
            as: 'members',
          },
        },
        {
          $addFields: {
            membersCount: { $size: '$members' },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            permissions: 1,
            createdAt: 1,
            updatedAt: 1,
            membersCount: 1,
          },
        },
        {
          $sort: { createdAt: -1 },
        },
      ])
      .exec();

    return successResponse('Roles fetched successfully', roles);
  }

  async findOne(id: string) {
    const role = await this.roleModel.aggregate([
      {
        $match: { _id: new Types.ObjectId(id) },
      },
      {
        $lookup: {
          from: 'adminusers',
          let: { roleId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$roleId', '$$roleId'],
                },
              },
            },
          ],
          as: 'members',
        },
      },
    ]);
    if (!role || role.length === 0) {
      throw new NotFoundException('Role not found');
    }
    return successResponse('Role fetched successfully', role[0]);
  }

  /**
   * Update a role by ID
   * @param id
   * @param updateRoleDto
   * @returns
   */
  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const findRole = this.roleModel.findById(id);
    if (!findRole) {
      throw new NotFoundException('Role not found');
    }

    // Remove duplicate permissions
    const uniquePermissions = [...new Set(updateRoleDto.permissions)];
    updateRoleDto.permissions = uniquePermissions;

    if (updateRoleDto.permissions.length === 0) {
      throw new BadRequestException('Role must have at least one permission');
    }
    if (
      updateRoleDto.permissions.some(
        (permission) => !Object.values(RequiredPermission).includes(permission),
      )
    ) {
      throw new UnprocessableEntityException('Invalid permission provided');
    }

    const role = await this.roleModel.findByIdAndUpdate(id, updateRoleDto, {
      new: true,
    });

    return successResponse('Role updated successfully', role);
  }

  async remove(id: number) {
    // Delete role requires moving members to another role or deleting them
    return `This action removes a #${id} role`;
  }

  async userHasPermission(
    userId: string,
    permissionName: string,
  ): Promise<boolean> {
    const user = await this.adminUserModel.findById(userId).populate('roleId');

    const role = user.roleId as unknown as RoleDocument;

    if (!role || role?.permissions?.length === 0) {
      return false;
    }

    return role.permissions.some((permission) => permission === permissionName);
  }

  async getGroupedPermissions() {
    return {
      status: true,
      message: 'Fetched permissions successfully',
      data: GroupedPermissions,
    };
  }
}
