<script setup lang="ts">
import { Input } from '@gosource/ui';
import { useDebounce } from '@vueuse/core';
import { Check, ChevronDown, X } from 'lucide-vue-next';
import MessageFormHeader from '~/components/messages/MessageFormHeader.vue';
import { useAdminHeader } from '~/composables/useAdminHeader';
import { useAdminListFetch } from '~/composables/useAdminListFetch';
import { useMessageMutations } from '~/composables/useMessageMutations';
import { ADMIN_PAGE_ROUTES } from '~/lib/admin-routes';
import { parseCustomersListResponse } from '~/lib/customer-api';

type Customer = {
  id: string;
  name: string;
};

const form = reactive({
  subject: '',
  message: '',
  customerIds: [] as string[],
});
const customerMenuOpen = ref(false);
const customerSearch = ref('');
const debouncedCustomerSearch = useDebounce(customerSearch, 300);
const selectedCustomerMap = ref<Map<string, Customer>>(new Map());
const { createMessage, busyMessageId } = useMessageMutations();

const customerQuery = computed(() => ({
  page: 1,
  limit: 50,
  search: debouncedCustomerSearch.value.trim() || undefined,
  customerStatus: 'true',
}));
const {
  data: customerData,
  pending: customersPending,
  error: customersError,
  refresh: refreshCustomers,
} = await useAdminListFetch<unknown>('/api/customers', {
  query: customerQuery,
  watch: [customerQuery],
});
const customers = computed<Customer[]>(() =>
  parseCustomersListResponse(customerData.value, 1, 50).rows.map(
    (customer) => ({
      id: customer.id,
      name: customer.displayName,
    }),
  ),
);

const allSelected = computed(() => form.customerIds.includes('all'));
const selectedCustomers = computed(() => [
  ...selectedCustomerMap.value.values(),
]);
const customerLabel = computed(() => {
  if (allSelected.value) return 'All customers';
  if (selectedCustomers.value.length > 1)
    return `${selectedCustomers.value.length} selected customers`;
  return selectedCustomers.value[0]?.name ?? 'Select customers';
});
const isFormValid = computed(() =>
  Boolean(
    form.subject.trim() && form.message.trim() && form.customerIds.length,
  ),
);

function toggleCustomer(id: string) {
  if (id === 'all') {
    form.customerIds = allSelected.value ? [] : ['all'];
    selectedCustomerMap.value = new Map();
    return;
  }

  const selected = new Set(form.customerIds.filter((value) => value !== 'all'));
  const nextMap = new Map(selectedCustomerMap.value);
  if (selected.has(id)) {
    selected.delete(id);
    nextMap.delete(id);
  } else {
    const customer = customers.value.find((item) => item.id === id);
    if (!customer) return;
    selected.add(id);
    nextMap.set(id, customer);
  }
  form.customerIds = [...selected];
  selectedCustomerMap.value = nextMap;
}

function goBack() {
  void navigateTo(ADMIN_PAGE_ROUTES.MESSAGES);
}

async function sendEmail() {
  if (!isFormValid.value) return;
  try {
    await createMessage({
      type: 'email',
      subject: form.subject.trim(),
      message: form.message.trim(),
      users: [...form.customerIds],
    });
    await navigateTo(ADMIN_PAGE_ROUTES.MESSAGES);
  } catch {
    // toast in composable
  }
}

useAdminHeader().updateHeader({ title: 'Add email message' });
useHead({ title: 'Add email message' });
</script>

<template>
  <div class="flex w-full flex-col gap-4">
    <MessageFormHeader
      action-label="Send email"
      :disabled="!isFormValid"
      :loading="busyMessageId === 'create'"
      @back="goBack"
      @submit="sendEmail"
    />

    <section
      class="flex flex-col gap-6 rounded-2xl border border-grey-50 bg-white p-6"
    >
      <div class="flex flex-col gap-4">
        <h2 class="text-base font-medium text-grey-900">Message Details</h2>
        <div class="h-px bg-grey-50" />
      </div>

      <div class="flex flex-col gap-2">
        <label for="email-subject" class="text-sm font-medium text-grey-900"
          >Subject</label
        >
        <Input
          id="email-subject"
          v-model="form.subject"
          autofocus
          placeholder="Enter subject"
        />
        <p class="text-xs text-grey-400">
          This acts as the subject of the email
        </p>
      </div>

      <div class="flex flex-col gap-2">
        <label for="email-message" class="text-sm font-medium text-grey-900"
          >Message</label
        >
        <textarea
          id="email-message"
          v-model="form.message"
          rows="6"
          placeholder="Enter message ..."
          class="w-full resize-y rounded-xl border border-border-input-default bg-grey-55 px-4 py-3 text-sm text-grey-900 outline-none transition placeholder:text-grey-400 focus:border-border-input-active"
        />
      </div>

      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-grey-900">Customers</label>

        <div
          v-if="selectedCustomers.length > 1 && !allSelected"
          class="flex flex-wrap gap-2"
        >
          <span
            v-for="customer in selectedCustomers"
            :key="customer.id"
            class="inline-flex items-center gap-2 rounded-full bg-grey-55 px-3 py-1 text-sm font-medium text-grey-900"
          >
            {{ customer.name }}
            <button
              type="button"
              :aria-label="`Remove ${customer.name}`"
              @click="toggleCustomer(customer.id)"
            >
              <X class="size-3.5 text-negative-500" />
            </button>
          </span>
        </div>

        <div class="relative">
          <button
            type="button"
            class="flex h-10 w-full items-center justify-between rounded-xl border border-border-input-default bg-grey-55 px-4 text-left text-sm"
            :class="form.customerIds.length ? 'text-grey-900' : 'text-grey-400'"
            @click="customerMenuOpen = !customerMenuOpen"
          >
            <span>{{ customerLabel }}</span>
            <ChevronDown class="size-4 text-grey-400" />
          </button>

          <div
            v-if="customerMenuOpen"
            class="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-grey-50 bg-white shadow-lg"
          >
            <div class="border-b border-grey-50 p-2">
              <Input v-model="customerSearch" placeholder="Search customers" />
            </div>
            <div class="max-h-56 overflow-y-auto p-1">
              <p
                v-if="customersPending"
                class="px-3 py-4 text-center text-sm text-grey-400"
              >
                Loading customers…
              </p>
              <div
                v-else-if="customersError"
                class="px-3 py-4 text-center text-sm text-negative-500"
              >
                <p>Unable to load customers.</p>
                <button
                  type="button"
                  class="mt-2 font-medium text-primary-600"
                  @click="refreshCustomers"
                >
                  Try again
                </button>
              </div>
              <button
                v-else
                type="button"
                class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-grey-55"
                @click="toggleCustomer('all')"
              >
                <span>All customers</span>
                <Check v-if="allSelected" class="size-4 text-primary-500" />
              </button>
              <button
                v-for="customer in customers"
                :key="customer.id"
                type="button"
                class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-grey-55"
                @click="toggleCustomer(customer.id)"
              >
                <span>{{ customer.name }}</span>
                <Check
                  v-if="form.customerIds.includes(customer.id)"
                  class="size-4 text-primary-500"
                />
              </button>
              <p
                v-if="
                  !customersPending && !customersError && customers.length === 0
                "
                class="px-3 py-4 text-center text-sm text-grey-400"
              >
                No customers found
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
