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
    style="
      width: 100%;
      max-width: 821px;
      box-sizing: border-box;
      background: #ffffff;
      color: #111827;
      font-family: Inter, Arial, sans-serif;
    "
  >
    <div style="background: #09420c; padding: 16px 24px">
      <div
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

    <div style="padding: 0 24px 24px">
      <div style="padding-top: 24px">
        <div style="display: flex; width: 100%">
          <div style="width: 50%; padding-right: 12px">
            <p style="margin: 0; font-size: 14px; color: #667085">Expected date</p>
            <p style="margin: 8px 0 0; font-size: 14px; font-weight: 600; color: #111827">
              {{ preview.expectedDateLabel }}
            </p>
          </div>
          <div style="width: 50%; padding-left: 12px">
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
        style="
          margin-top: 24px;
          border: 1px solid #f0f2f5;
          border-radius: 8px;
          overflow-x: auto;
        "
      >
        <table
          style="
            width: 100%;
            min-width: 0;
            border-collapse: collapse;
            font-size: 14px;
            table-layout: fixed;
          "
        >
          <thead>
            <tr style="background: #ebf9ed">
              <th
                v-for="(header, headerIndex) in tableHeaders"
                :key="header"
                :style="{
                  padding: '10px',
                  textAlign: 'left',
                  fontWeight: 400,
                  color: '#667085',
                  width:
                    headerIndex === 0
                      ? '8%'
                      : headerIndex === 1
                        ? '36%'
                        : headerIndex === 2
                          ? '10%'
                          : '23%',
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
              <td style="padding: 10px; color: #111827">{{ index + 1 }}.</td>
              <td
                style="
                  padding: 10px;
                  color: #111827;
                  font-weight: 500;
                  word-break: break-word;
                  overflow-wrap: anywhere;
                "
              >
                {{ item.name }}
              </td>
              <td style="padding: 10px; color: #111827">{{ item.quantity }}</td>
              <td style="padding: 10px; color: #111827">
                {{ formatPrice(item.unitPrice) }}
              </td>
              <td style="padding: 10px; color: #111827">
                {{ formatPrice(item.totalPrice) }}
              </td>
            </tr>
          </tbody>
        </table>
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
