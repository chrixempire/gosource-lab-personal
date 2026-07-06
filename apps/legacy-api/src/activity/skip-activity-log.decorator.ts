import { SetMetadata } from '@nestjs/common';

export const SKIP_ACTIVITY_LOG = 'skipActivityLog';

/**
 * Mark a controller or handler so the global AdminActivityInterceptor does NOT
 * auto-log it — use on endpoints that write their own richer activity log
 * (e.g. inventory) or that shouldn't be logged at all (e.g. auth, which logs
 * login/logout explicitly).
 */
export const SkipActivityLog = () => SetMetadata(SKIP_ACTIVITY_LOG, true);
