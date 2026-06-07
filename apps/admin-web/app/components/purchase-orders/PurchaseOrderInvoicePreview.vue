<script setup lang="ts">
import type { PurchaseOrderInvoicePreview } from '~/types/purchase-orders';

const props = defineProps<{
  preview: PurchaseOrderInvoicePreview;
}>();

const tableHeaders = ['No.', 'Item', 'Qty', 'Rate', 'Price'];

function formatPrice(value: number) {
  return `NGN${(value ?? 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

const logoSrc =
  typeof window !== 'undefined'
    ? `${window.location.origin}/svgs/logo-gosource-white.svg`
    : '/svgs/logo-gosource-white.svg';
</script>

<template>
  <!-- Same root id as gosource-admin-v2 for PDF capture -->
  <div
    id="preview-invoice"
    class="invoice-preview-root box-border w-full max-w-[821px] bg-white font-[Inter,Arial,sans-serif] text-grey-900"
  >
    <div class="invoice-preview-header" style="background: #09420c; padding: 16px 24px">
      <div
        class="invoice-preview-header-row"
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        "
      >
        <img
          :src="logoSrc"
          alt="GoSource"
          crossorigin="anonymous"
          style="display: block; width: 150px; height: 30px; object-fit: contain"
        >
        <div
          class="invoice-preview-reference"
          style="
            min-width: 0;
            font-size: 24px;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.2;
            text-align: right;
            word-break: break-word;
          "
        >
          {{ preview.referenceLabel }}
        </div>
      </div>
    </div>

    <div class="invoice-preview-body" style="padding: 0 24px 24px">
      <div style="padding-top: 24px">
        <div class="invoice-preview-meta-row" style="display: flex; width: 100%">
          <div class="invoice-preview-meta-col" style="width: 50%; padding-right: 12px">
            <p style="margin: 0; font-size: 14px; color: #667085">Expected date</p>
            <p style="margin: 8px 0 0; font-size: 14px; font-weight: 600; color: #111827">
              {{ preview.expectedDateLabel }}
            </p>
          </div>
          <div class="invoice-preview-meta-col" style="width: 50%; padding-left: 12px">
            <p style="margin: 0; font-size: 14px; color: #667085">Ordered by</p>
            <p style="margin: 8px 0 0; font-size: 14px; font-weight: 600; color: #111827">
              {{ preview.orderedByLabel }}
            </p>
          </div>
        </div>

        <div style="margin-top: 24px">
          <p style="margin: 0 0 12px; font-size: 14px; color: #667085">Bill to</p>
          <div style="display: block; width: 100%">
            <div
              v-for="(person, index) in preview.billTo"
              :key="index"
              class="invoice-preview-bill-to-item"
              style="
                display: inline-block;
                width: 48%;
                vertical-align: top;
                margin-bottom: 12px;
                margin-right: 2%;
              "
            >
              <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827">
                {{ person.name || '—' }}
              </p>
              <p style="margin: 4px 0 0; font-size: 14px; color: #475467">
                {{ person.email || '—' }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        class="invoice-line-items-shell"
        style="
          margin-top: 24px;
          border: 1px solid #f0f2f5;
          border-radius: 8px;
          overflow-x: auto;
        "
      >
        <table
          class="invoice-line-items-table"
          style="
            width: 100%;
            min-width: 520px;
            border-collapse: collapse;
            font-size: 14px;
            table-layout: auto;
          "
        >
          <thead>
            <tr style="background: #ebf9ed">
              <th
                v-for="(header, headerIndex) in tableHeaders"
                :key="header"
                :style="{
                  padding: '10px 12px',
                  textAlign: headerIndex >= 3 ? 'right' : 'left',
                  fontWeight: 400,
                  color: '#667085',
                  whiteSpace: 'nowrap',
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
              style="border-top: 1px solid #f0f2f5"
            >
              <td style="padding: 10px 12px; color: #111827; white-space: nowrap">
                {{ index + 1 }}.
              </td>
              <td
                style="
                  padding: 10px 12px;
                  color: #111827;
                  font-weight: 500;
                  word-break: break-word;
                  overflow-wrap: anywhere;
                "
              >
                {{ item.name }}
              </td>
              <td style="padding: 10px 12px; color: #111827; text-align: right; white-space: nowrap">
                {{ item.quantity }}
              </td>
              <td
                style="
                  padding: 10px 12px;
                  color: #111827;
                  text-align: right;
                  white-space: nowrap;
                  font-variant-numeric: tabular-nums;
                "
              >
                {{ formatPrice(item.unitPrice) }}
              </td>
              <td
                style="
                  padding: 10px 12px;
                  color: #111827;
                  text-align: right;
                  white-space: nowrap;
                  font-weight: 600;
                  font-variant-numeric: tabular-nums;
                "
              >
                {{ formatPrice(item.totalPrice) }}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="invoice-line-items-cards">
          <article
            v-for="(item, index) in preview.lineItems"
            :key="`card-${item.name}-${index}`"
            class="invoice-line-item-card"
          >
            <div class="invoice-line-item-card-head">
              <span class="invoice-line-item-index">{{ index + 1 }}.</span>
              <p class="invoice-line-item-name">{{ item.name }}</p>
            </div>
            <dl class="invoice-line-item-stats">
              <div>
                <dt>Qty</dt>
                <dd>{{ item.quantity }}</dd>
              </div>
              <div>
                <dt>Rate</dt>
                <dd>{{ formatPrice(item.unitPrice) }}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>{{ formatPrice(item.totalPrice) }}</dd>
              </div>
            </dl>
          </article>
        </div>
      </div>

      <div
        style="
          margin-top: 24px;
          border: 1px solid #f0f2f5;
          border-radius: 12px;
          padding: 12px 16px;
          background: #f9fafb;
        "
      >
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px">
          <span style="font-size: 14px; color: #667085">Subtotal</span>
          <span style="font-size: 14px; font-weight: 600; color: #111827">
            {{ formatPrice(preview.subtotal) }}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px">
          <span style="font-size: 14px; color: #667085">Logistics Amount</span>
          <span style="font-size: 14px; font-weight: 600; color: #111827">
            {{ formatPrice(preview.logisticsAmount) }}
          </span>
        </div>
        <div style="display: flex; justify-content: space-between">
          <span style="font-size: 14px; color: #111827">Total</span>
          <span style="font-size: 14px; font-weight: 700; color: #111827">
            {{ formatPrice(preview.total) }}
          </span>
        </div>
      </div>

      <div style="margin-top: 24px">
        <p style="margin: 0; font-size: 14px; color: #667085">Notes</p>
        <p style="margin: 8px 0 0; font-size: 14px; font-weight: 600; color: #111827">
          {{ preview.note || 'No notes provided.' }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.invoice-preview-root {
  box-sizing: border-box;
  background: #ffffff;
  color: #111827;
  font-family: Inter, Arial, sans-serif;
  container-type: inline-size;
}

.invoice-line-items-cards {
  display: none;
}

.invoice-line-item-card {
  border-top: 1px solid #f0f2f5;
  padding: 12px 14px;
}

.invoice-line-item-card:first-child {
  border-top: none;
}

.invoice-line-item-card-head {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.invoice-line-item-index {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 500;
  color: #667085;
}

.invoice-line-item-name {
  margin: 0;
  min-width: 0;
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: #111827;
  word-break: break-word;
}

.invoice-line-item-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 12px 0 0;
  padding-top: 12px;
  border-top: 1px solid #f0f2f5;
}

.invoice-line-item-stats dt {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #667085;
}

.invoice-line-item-stats dd {
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: #111827;
  word-break: break-word;
}

@container (max-width: 520px) {
  .invoice-line-items-table {
    display: none;
  }

  .invoice-line-items-cards {
    display: block;
  }

  .invoice-line-items-shell {
    overflow-x: visible !important;
  }
}

@media (max-width: 999px) {
  .invoice-preview-header {
    padding: 14px 16px !important;
  }

  .invoice-preview-header-row {
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
  }

  .invoice-preview-reference {
    font-size: 18px !important;
    text-align: right !important;
  }

  .invoice-preview-body {
    padding: 0 16px 20px !important;
  }

  .invoice-preview-meta-row {
    flex-direction: column;
    gap: 16px;
  }

  .invoice-preview-meta-col {
    width: 100% !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  .invoice-preview-bill-to-item {
    display: block !important;
    width: 100% !important;
    margin-right: 0 !important;
  }
}
</style>
