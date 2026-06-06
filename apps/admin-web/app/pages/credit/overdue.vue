<script setup lang="ts">
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';

await navigateTo(
  { path: ADMIN_PAGE_ROUTES.CREDIT_SCHEDULES, query: { tab: 'overdue' } },
  { replace: true },
);
</script>
