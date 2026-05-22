<script setup lang="ts">
import { computed } from 'vue';
import type { OrderInvoicePreview } from '~/types/order-invoice';

const props = withDefaults(
  defineProps<{
    preview: OrderInvoicePreview;
    /** 3 columns in drawer preview; 4 columns in downloaded PDF. */
    infoColumnCount?: 3 | 4;
  }>(),
  {
    infoColumnCount: 3,
  },
);

const tableHeaders = ['No.', 'Item', 'Qty', 'Rate', 'Price'];

const infoFields = computed(() => [
  { label: 'Order date', value: props.preview.orderDateLabel },
  { label: 'Business name', value: props.preview.businessName },
  { label: 'Branch name', value: props.preview.branchName },
  { label: 'Full name', value: props.preview.customerName },
  { label: 'Delivery address', value: props.preview.deliveryAddress },
  { label: 'Payment method', value: props.preview.paymentMethod },
  { label: 'Items ordered', value: props.preview.itemsOrderedLabel },
]);

const summaryRows = computed(() => [
  { label: 'Subtotal', value: props.preview.subtotal },
  { label: 'Delivery fee', value: props.preview.deliveryFee },
  { label: 'Discount', value: props.preview.discount },
  { label: 'Service charge', value: props.preview.serviceCharge },
  { label: 'Total', value: props.preview.total, bold: true },
]);

const isDownloadLayout = computed(() => props.infoColumnCount === 4);

const typography = computed(() =>
  isDownloadLayout.value
    ? {
        base: '16px',
        label: '15px',
        value: '16px',
        table: '15px',
        reference: '26px',
        cellPadding: '12px',
        logoHeight: '34px',
        sectionGap: '28px',
        contentPadding: '28px',
      }
    : {
        base: '14px',
        label: '14px',
        value: '14px',
        table: '14px',
        reference: '20px',
        cellPadding: '10px',
        logoHeight: '30px',
        sectionGap: '24px',
        contentPadding: '24px',
      },
);

const infoGridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${props.infoColumnCount}, minmax(0, 1fr))`,
  columnGap: isDownloadLayout.value ? '16px' : '12px',
  rowGap: isDownloadLayout.value ? '20px' : '16px',
}));

const rootStyle = computed(() => ({
  fontSize: typography.value.base,
  lineHeight: isDownloadLayout.value ? '1.5' : '1.45',
}));

function formatPrice(value: number) {
  return `₦${(value ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`;
}

const logoSrc =
  typeof window !== 'undefined'
    ? `${window.location.origin}/svgs/logo-gosource-white.svg`
    : '/svgs/logo-gosource-white.svg';

const outerBorderStyle = '1px solid #f0f2f5';
const headerBg = '#ebf9ed';

function tableCellStyle(options: { isLastRow?: boolean; isHeader?: boolean; isSummary?: boolean } = {}) {
  return {
    padding: typography.value.cellPadding,
    fontSize: typography.value.table,
    borderLeft: 'none',
    borderRight: 'none',
    borderTop: 'none',
    borderBottom: options.isLastRow ? 'none' : '1px solid #f0f2f5',
    background: options.isHeader || options.isSummary ? headerBg : undefined,
  };
}
</script>

<template>
  <div
    id="preview-invoice"
    class="box-border w-full max-w-[821px] bg-white font-[Inter,Arial,sans-serif] text-grey-900"
    :style="rootStyle"
  >
    <div class="flex min-h-[76px] items-center justify-between gap-3 bg-[#09420c] px-6 py-4">
      <img
        :src="logoSrc"
        alt="GoSource"
        crossorigin="anonymous"
        class="block w-[150px] object-contain"
        :style="{ height: typography.logoHeight }"
      >
      <p
        class="text-right font-semibold capitalize text-white"
        :style="{ fontSize: typography.reference }"
      >
        {{ preview.referenceLabel }}
      </p>
    </div>

    <div :style="{ padding: typography.contentPadding, display: 'flex', flexDirection: 'column', gap: typography.sectionGap }">
      <div :style="infoGridStyle">
        <div
          v-for="(item, index) in infoFields"
          :key="`order-info-${index}`"
          class="flex flex-col gap-3"
        >
          <p
            class="text-grey-500"
            :style="{ fontSize: typography.label, lineHeight: '1.4' }"
          >
            {{ item.label }}
          </p>
          <p
            class="font-semibold text-grey-900"
            :style="{ fontSize: typography.value, lineHeight: '1.4' }"
          >
            {{ item.value }}
          </p>
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg" :style="{ border: outerBorderStyle }">
        <table
          class="w-full"
          :style="{ borderCollapse: 'collapse', width: '100%', fontSize: typography.table }"
        >
          <thead>
            <tr :style="{ background: headerBg }">
              <th
                v-for="(header, headerIndex) in tableHeaders"
                :key="header"
                class="text-left font-normal text-grey-600"
                :style="{
                  ...tableCellStyle({ isHeader: true }),
                  textAlign: headerIndex === tableHeaders.length - 1 ? 'right' : 'left',
                }"
              >
                {{ header }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in preview.lineItems"
              :key="`${item.name}-${index}`"
            >
              <td
                class="text-grey-700"
                :style="tableCellStyle({ isLastRow: index === preview.lineItems.length - 1 })"
              >
                {{ index + 1 }}.
              </td>
              <td
                class="font-semibold text-grey-900"
                :style="tableCellStyle({ isLastRow: index === preview.lineItems.length - 1 })"
              >
                {{ item.name }}
              </td>
              <td
                class="text-grey-700"
                :style="tableCellStyle({ isLastRow: index === preview.lineItems.length - 1 })"
              >
                {{ item.quantityLabel }}
              </td>
              <td
                class="text-grey-700"
                :style="tableCellStyle({ isLastRow: index === preview.lineItems.length - 1 })"
              >
                {{ formatPrice(item.unitPrice) }}
              </td>
              <td
                class="text-right font-semibold text-grey-900"
                :style="tableCellStyle({ isLastRow: index === preview.lineItems.length - 1 })"
              >
                {{ formatPrice(item.totalPrice) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="overflow-x-auto rounded-lg" :style="{ border: outerBorderStyle }">
        <table
          class="w-full"
          :style="{
            borderCollapse: 'collapse',
            width: '100%',
            background: headerBg,
            fontSize: typography.table,
          }"
        >
          <tbody>
            <tr
              v-for="(row, index) in summaryRows"
              :key="`summary-${index}`"
            >
              <td
                class="text-grey-600"
                :style="{
                  ...tableCellStyle({
                    isSummary: true,
                    isLastRow: index === summaryRows.length - 1,
                  }),
                  width: '50%',
                }"
              >
                {{ row.label }}
              </td>
              <td
                class="text-right text-grey-900"
                :class="row.bold ? 'font-bold' : 'font-semibold'"
                :style="{
                  ...tableCellStyle({
                    isSummary: true,
                    isLastRow: index === summaryRows.length - 1,
                  }),
                  width: '50%',
                }"
              >
                {{ formatPrice(row.value) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
