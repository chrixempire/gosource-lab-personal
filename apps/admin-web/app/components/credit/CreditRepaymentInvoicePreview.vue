<script setup lang="ts">
import { CREDIT_REPAYMENT_INVOICE_ELEMENT_ID } from '~/lib/credit-repayment-invoice';
import type { CreditRepaymentInvoicePreview } from '~/types/credit-repayment-invoice';

defineProps<{
  preview: CreditRepaymentInvoicePreview;
}>();

const logoSrc =
  import.meta.client && typeof window !== 'undefined'
    ? `${window.location.origin}/svgs/logo-gosource-white.svg`
    : '/svgs/logo-gosource-white.svg';
</script>

<template>
  <div :id="CREDIT_REPAYMENT_INVOICE_ELEMENT_ID" class="credit-repayment-invoice">
    <table>
      <tr>
        <td class="logo" colspan="2">
          <div class="header">
            <img :src="logoSrc" alt="GoSource Logo" style="height: 34px" />
            <span>{{ preview.referenceCode }}</span>
          </div>
        </td>
      </tr>
    </table>

    <div class="table-container">
      <div class="summary-block">
        <table class="user-details">
          <thead>
            <tr>
              <th>Business name</th>
              <th>Reference</th>
              <th>Date issued</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ preview.businessName }}</td>
              <td>{{ preview.referenceCode }}</td>
              <td>{{ preview.dateIssuedLabel }}</td>
            </tr>
          </tbody>
        </table>

        <table class="user-details">
          <thead>
            <tr>
              <th>Amount paid</th>
              <th>Method</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ preview.amountPaidLabel }}</td>
              <td>{{ preview.paymentMethodLabel }}</td>
              <td>{{ preview.totalLabel }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <table class="credit">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount paid</th>
            <th>Method</th>
            <th>Ref ID</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(line, index) in preview.lineItems" :key="index">
            <td>{{ line.dateLabel }}</td>
            <td>{{ line.amountLabel }}</td>
            <td>{{ line.methodLabel }}</td>
            <td>{{ line.referenceCode }}</td>
          </tr>
        </tbody>
      </table>

      <table class="credit-total">
        <tr>
          <td>Total</td>
          <td class="amount">{{ preview.totalLabel }}</td>
        </tr>
      </table>

      <table class="footer">
        <tr>
          <td colspan="2" class="content">Notes</td>
        </tr>
        <tr>
          <td colspan="2" class="content">
            This invoice confirms repayment recorded on GoSource.
            <br />
            Thank you for staying compliant with your credit terms.
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>

<style scoped>
.credit-repayment-invoice {
  --primary-color: #09420c;
  --text-default: #232b38;
  --text-neutral: #667185;
  --light-gray: #f0f2f5;
  --table-border-color: #f0f2f5;
  --font-family: Inter, sans-serif;
  --font-size: 14px;
  --font-size-large: 34px;
  font-family: var(--font-family);
  background: #fff;
  color: var(--text-default);
}

.table-container {
  max-width: 90%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.summary-block {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th,
table td {
  padding: 0 12px;
  font-size: var(--font-size);
  text-align: left;
}

table .logo {
  background-color: var(--primary-color);
  color: white;
  padding: 24px;
}

table .header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--font-size-large);
  font-weight: 500;
}

table .header img {
  max-width: 120px;
}

table .amount {
  text-align: right;
  font-weight: 500;
}

.credit-total {
  background-color: var(--light-gray);
  border-radius: 12px;
}

.credit-total td {
  font-weight: 500;
  padding: 8px 12px;
  height: 48px;
}

.credit-total td:nth-of-type(1) {
  color: var(--text-neutral);
}

.user-details th,
.user-details td {
  width: 33%;
  padding-top: 5px;
  padding-bottom: 5px;
}

.user-details th {
  color: var(--text-neutral);
  font-weight: 400;
}

.user-details td {
  font-weight: 500;
}

.credit th,
.credit td {
  padding: 10px;
}

.credit th {
  background-color: var(--light-gray);
  color: var(--text-neutral);
}

.credit tbody {
  border: 1px solid var(--table-border-color);
}

.credit tbody tr {
  border-bottom: 1px solid var(--light-gray);
}

.footer tr:nth-of-type(1) td {
  color: var(--text-neutral);
  padding-bottom: 12px;
}

.footer .content {
  font-size: 14px;
  padding-bottom: 12px;
  font-weight: 500;
}
</style>
