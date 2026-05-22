import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { type Collection, type Db, type Document } from 'mongodb';
import { MongoService } from '../../infrastructure/mongo/mongo.service';
import {
  ADMIN_USER_COLLECTION,
  type AdminUserDocument,
} from '../../infrastructure/mongo/schemas/admin-user.schema';
import {
  ROLE_COLLECTION,
  type RoleDocument,
} from '../../infrastructure/mongo/schemas/role.schema';

type AdminWithRoleRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  phoneNumber: string | null;
  status: string;
  roleId: string;
  roleName: string;
  roleIsActive: boolean;
};

@Injectable()
export class AdminAuthRepository {
  constructor(private readonly mongoService: MongoService) {}

  private get mongoDb(): Db {
    const db = this.mongoService.db;
    if (!db) {
      throw new Error('MongoDB connection is unavailable');
    }
    return db;
  }

  private collection<T extends Document>(name: string): Collection<T> {
    return this.mongoDb.collection<T>(name);
  }

  async findAdminByEmail(email: string): Promise<AdminWithRoleRecord | null> {
    const admin = await this.collection<AdminUserDocument>(ADMIN_USER_COLLECTION).findOne({
      email,
    });

    if (!admin) {
      return null;
    }

    const role = await this.collection<RoleDocument>(ROLE_COLLECTION).findOne({
      _id: admin.roleId,
    });

    return {
      id: admin._id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      passwordHash: admin.passwordHash,
      phoneNumber: admin.phoneNumber ?? null,
      status: admin.status,
      roleId: admin.roleId,
      roleName: role?.name ?? 'super_admin',
      roleIsActive: role?.isActive ?? true,
    };
  }

  async findAnyAdmin(): Promise<{ id: string } | null> {
    const admin = await this.collection<AdminUserDocument>(ADMIN_USER_COLLECTION).findOne(
      {},
      {
        projection: { _id: 1 },
      },
    );

    return admin ? { id: admin._id } : null;
  }

  async ensureRole(name: string): Promise<{ id: string; name: string }> {
    const roles = this.collection<RoleDocument>(ROLE_COLLECTION);
    const existingRole = await roles.findOne({ name });

    if (existingRole) {
      return { id: existingRole._id, name: existingRole.name };
    }

    const role = {
      _id: randomUUID(),
      name,
      permissions: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } satisfies RoleDocument;

    await roles.insertOne(role);

    return { id: role._id, name: role.name };
  }

  async createAdmin(data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    passwordHash: string;
    roleId: string;
    status: string;
  }): Promise<void> {
    await this.collection<AdminUserDocument>(ADMIN_USER_COLLECTION).insertOne({
      _id: randomUUID(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phoneNumber: data.phoneNumber ?? null,
      passwordHash: data.passwordHash,
      roleId: data.roleId,
      status: data.status as AdminUserDocument['status'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
