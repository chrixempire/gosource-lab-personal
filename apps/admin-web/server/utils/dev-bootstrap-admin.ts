import bcrypt from 'bcrypt';
import { createError, getHeader, type H3Event } from 'h3';
import { MongoClient, ObjectId } from 'mongodb';
import { getDatabaseNameFromMongoUri } from './mongo-database';

export type DevBootstrapAdminPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleName?: string;
};

function assertDevBootstrapEnabled(event: H3Event) {
  const config = useRuntimeConfig(event);

  if (process.env.NODE_ENV === 'production') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
    });
  }

  if (String(config.devAdminBootstrapEnabled) !== 'true') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
    });
  }
}

export function assertDevBootstrapSecret(event: H3Event) {
  assertDevBootstrapEnabled(event);

  const config = useRuntimeConfig(event);
  const expected = String(config.devAdminBootstrapSecret ?? '').trim();

  if (!expected) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_DEV_ADMIN_BOOTSTRAP_SECRET is not configured',
    });
  }

  const provided = String(getHeader(event, 'x-dev-bootstrap-secret') ?? '').trim();

  if (provided !== expected) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid bootstrap secret',
    });
  }
}

async function ensureRole(
  db: ReturnType<MongoClient['db']>,
  roleName: string,
): Promise<ObjectId> {
  const roles = db.collection('roles');
  const existing = await roles.findOne({ name: roleName });

  if (existing?._id) {
    return existing._id as ObjectId;
  }

  const inserted = await roles.insertOne({
    name: roleName,
    description: `Dev bootstrap ${roleName}`,
    permissions: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return inserted.insertedId;
}

export async function bootstrapDevAdmin(event: H3Event, payload: DevBootstrapAdminPayload) {
  assertDevBootstrapSecret(event);

  const config = useRuntimeConfig(event);
  const mongoUri = String(config.devMongoUri ?? '').trim();

  if (!mongoUri) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_DEV_MONGODB_URI is not configured',
    });
  }

  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();
  const email = payload.email.trim().toLowerCase();
  const password = payload.password;
  const roleName = (payload.roleName ?? 'super_admin').trim();

  if (!firstName || !lastName || !email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'firstName, lastName, email, and password are required',
    });
  }

  const client = new MongoClient(mongoUri);

  try {
    await client.connect();
    const databaseName = getDatabaseNameFromMongoUri(mongoUri);
    const db = client.db(databaseName);
    const adminUsers = db.collection('adminusers');

    const existing = await adminUsers.findOne({ email });
    if (existing) {
      throw createError({
        statusCode: 409,
        statusMessage: 'An admin with this email already exists',
      });
    }

    const roleId = await ensureRole(db, roleName);
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await adminUsers.insertOne({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      roleId,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const passwordMatches = await bcrypt.compare(password, hashedPassword);
    if (!passwordMatches) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Password hash verification failed after insert',
      });
    }

    return {
      message: `Admin account created in database "${databaseName}"`,
      data: {
        id: String(result.insertedId),
        email,
        role: roleName,
        status: 'active',
        database: databaseName,
      },
    };
  } finally {
    await client.close();
  }
}
