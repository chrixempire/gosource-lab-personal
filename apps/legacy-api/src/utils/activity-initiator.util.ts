import { INITIATOR_TYPE } from '../activity/interface/activityLog.interface';

type AdminLike = {
  id?: string;
  _id?: unknown;
  firstName?: string;
  lastName?: string;
  role?: string;
} | null
  | undefined;

/**
 * Build the initiator fields for an activity log from an authenticated admin
 * (`request.user`, i.e. the decoded JWT). Snapshots the admin id (for
 * traceability) plus a readable name and role at log time, so the activity log
 * can show who acted and in what role even if the admin is later changed.
 */
export function adminInitiator(admin: AdminLike): {
  initiator: string | null;
  initiatorName: string | null;
  initiatorRole: string | null;
  initiatorType: INITIATOR_TYPE;
} {
  const id = admin?.id ?? (admin?._id != null ? String(admin._id) : null);
  const name = admin
    ? `${admin.firstName ?? ''} ${admin.lastName ?? ''}`.trim()
    : '';

  return {
    initiator: id ? String(id) : null,
    initiatorName: name || null,
    initiatorRole: admin?.role || null,
    initiatorType: INITIATOR_TYPE.ADMIN,
  };
}
