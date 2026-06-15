<script setup lang="ts">
import { CREDIT_REPAYMENT_INVOICE_ELEMENT_ID } from '~/lib/credit-repayment-invoice';
import type { CreditRepaymentInvoicePreview } from '~/lib/credit-repayment-invoice';

defineProps<{
  preview: CreditRepaymentInvoicePreview;
}>();

const SIDE_PADDING = '41px';
const cellPad = `5px 12px`;
const sectionPad = `0 ${SIDE_PADDING}`;
</script>

<template>
  <div
    :id="CREDIT_REPAYMENT_INVOICE_ELEMENT_ID"
    style="
      width: 821px;
      box-sizing: border-box;
      background: #ffffff;
      color: #232b38;
      font-family:
        Inter,
        system-ui,
        -apple-system,
        'Segoe UI',
        Roboto,
        Helvetica,
        Arial,
        sans-serif;
      font-size: 14px;
      overflow: visible;
    "
  >
    <table style="width: 100%; border-collapse: collapse; table-layout: fixed">
      <tbody>
        <tr>
          <td
            style="
              background-color: #09420c;
              color: #ffffff;
              padding: 24px 41px;
            "
          >
            <table style="width: 100%; border-collapse: collapse; table-layout: fixed">
              <tbody>
                <tr>
                  <td style="width: 50%; vertical-align: middle">
                    <img
                      src="/images/Gosourcelogo.png"
                      alt="GoSource"
                      style="width: 140px; height: auto; display: block"
                    >
                  </td>
                  <td
                    style="
                      width: 50%;
                      vertical-align: middle;
                      text-align: right;
                      font-size: 14px;
                      font-weight: 500;
                      line-height: 1.2;
                      padding-left: 12px;
                    "
                  >
                    {{ preview.referenceCode }}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <div :style="{ padding: sectionPad }">
      <table
        style="
          width: 100%;
          margin-top: 24px;
          border-collapse: collapse;
          table-layout: fixed;
        "
      >
        <thead>
          <tr>
            <th
              style="
                width: 33%;
                padding: 5px 12px;
                text-align: left;
                color: #667185;
                font-weight: 400;
              "
            >
              Business Name
            </th>
            <th
              style="
                width: 33%;
                padding: 5px 12px;
                text-align: left;
                color: #667185;
                font-weight: 400;
              "
            >
              Reference
            </th>
            <th
              style="
                width: 34%;
                padding: 5px 12px;
                text-align: left;
                color: #667185;
                font-weight: 400;
              "
            >
              Date Issued
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td :style="{ padding: cellPad, fontWeight: 500 }">{{ preview.businessName }}</td>
            <td :style="{ padding: cellPad, fontWeight: 500 }">{{ preview.referenceCode }}</td>
            <td :style="{ padding: cellPad, fontWeight: 500 }">{{ preview.dateIssuedLabel }}</td>
          </tr>
        </tbody>
      </table>

      <table
        style="
          width: 100%;
          margin-top: 4px;
          border-collapse: collapse;
          table-layout: fixed;
        "
      >
        <thead>
          <tr>
            <th
              style="
                width: 33%;
                padding: 5px 12px;
                text-align: left;
                color: #667185;
                font-weight: 400;
              "
            >
              Amount Paid
            </th>
            <th
              style="
                width: 33%;
                padding: 5px 12px;
                text-align: left;
                color: #667185;
                font-weight: 400;
              "
            >
              Method
            </th>
            <th
              style="
                width: 34%;
                padding: 5px 12px;
                text-align: left;
                color: #667185;
                font-weight: 400;
              "
            >
              Total Repaid
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td :style="{ padding: cellPad, fontWeight: 500 }">{{ preview.amountPaidLabel }}</td>
            <td :style="{ padding: cellPad, fontWeight: 500 }">{{ preview.paymentMethodLabel }}</td>
            <td :style="{ padding: cellPad, fontWeight: 500 }">{{ preview.totalLabel }}</td>
          </tr>
        </tbody>
      </table>

      <table
        style="
          width: 100%;
          margin-top: 24px;
          border-collapse: collapse;
          table-layout: fixed;
        "
      >
        <thead>
          <tr>
            <th
              style="
                padding: 10px;
                text-align: left;
                background-color: #f0f2f5;
                color: #667185;
                font-weight: 400;
              "
            >
              Date
            </th>
            <th
              style="
                padding: 10px;
                text-align: left;
                background-color: #f0f2f5;
                color: #667185;
                font-weight: 400;
              "
            >
              Amount Paid
            </th>
            <th
              style="
                padding: 10px;
                text-align: left;
                background-color: #f0f2f5;
                color: #667185;
                font-weight: 400;
              "
            >
              Method
            </th>
            <th
              style="
                padding: 10px;
                text-align: left;
                background-color: #f0f2f5;
                color: #667185;
                font-weight: 400;
              "
            >
              Ref ID
            </th>
          </tr>
        </thead>
        <tbody style="border: 1px solid #f0f2f5">
          <tr
            v-for="(line, index) in preview.lineItems"
            :key="index"
            style="border-bottom: 1px solid #f0f2f5"
          >
            <td style="padding: 10px">{{ line.dateLabel }}</td>
            <td style="padding: 10px">{{ line.amountLabel }}</td>
            <td style="padding: 10px">{{ line.methodLabel }}</td>
            <td style="padding: 10px; word-break: break-all">{{ line.referenceCode }}</td>
          </tr>
        </tbody>
      </table>

      <table
        style="
          width: 100%;
          margin-top: 24px;
          border-collapse: collapse;
          table-layout: fixed;
          background-color: #f0f2f5;
          border-radius: 12px;
        "
      >
        <tbody>
          <tr>
            <td
              style="
                width: 50%;
                padding: 8px 12px;
                height: 48px;
                font-weight: 500;
                color: #667185;
              "
            >
              Total
            </td>
            <td
              style="
                width: 50%;
                padding: 8px 12px;
                height: 48px;
                font-weight: 500;
                text-align: right;
                white-space: nowrap;
              "
            >
              {{ preview.totalLabel }}
            </td>
          </tr>
        </tbody>
      </table>

      <table
        style="
          width: 100%;
          margin-top: 24px;
          margin-bottom: 24px;
          border-collapse: collapse;
        "
      >
        <tbody>
          <tr>
            <td
              style="
                padding-bottom: 12px;
                color: #667185;
                font-size: 14px;
                font-weight: 500;
              "
            >
              Notes
            </td>
          </tr>
          <tr>
            <td
              style="
                padding-bottom: 12px;
                font-size: 14px;
                font-weight: 500;
              "
            >
              This invoice confirms full repayment for your credit cycle.
              <br>
              Thank you for staying compliant with your credit terms on GoSource.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
