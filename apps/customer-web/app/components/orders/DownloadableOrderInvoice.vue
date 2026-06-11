<template>
  <div id="invoice-temp" style="width: 821px; background: #ffffff; color: #101928">
    <table>
      <thead>
        <tr>
          <td class="logo" colspan="2">
            <div
              style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                font-family:
                  'Inter',
                  'system-ui',
                  -apple-system,
                  'Segoe UI',
                  Roboto,
                  Helvetica,
                  Arial,
                  sans-serif;
                font-size: 34px;
                font-weight: 700;
                letter-spacing: -1px;
              "
            >
              <img src="/images/Gosourcelogo.png" alt="GoSource" />
            </div>
          </td>
        </tr>
      </thead>
    </table>

    <table style="margin-top: 40px" class="user-details">
      <thead>
        <tr>
          <td class="table-head">Order Date</td>
          <td class="table-head">Business name</td>
          <td class="table-head">Full name</td>
          <td class="table-head">No. of Orders</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding-bottom: 10px">
            {{ formatDates(orders.createdAt) }}
          </td>
          <td style="padding-bottom: 10px">
            {{ orders.business.businessName }}
          </td>
          <td style="padding-bottom: 10px">
            {{ orders.request.initiator?.firstName }}
            {{ orders.request.initiator?.lastName }}
          </td>
          <td style="padding-bottom: 10px">{{ orders.products.length }}</td>
        </tr>
      </tbody>
    </table>

    <table style="margin-top: 24px" class="user-details">
      <thead>
        <tr>
          <td class="table-head">Order Time</td>
          <td class="table-head">Payment Method</td>
          <td class="table-head">Order Id</td>
          <td class="table-head">Delivery Address</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding-bottom: 10px">
            {{ formatTimeWithAMPM(orders.createdAt) }}
          </td>
          <td style="padding-bottom: 10px">{{ orders.paymentMethod }}</td>
          <td style="padding-bottom: 10px">{{ orders.reference }}</td>
          <td style="padding-bottom: 10px">
            <span style="max-width: 176px">
              {{ orders.address.streetAddress }},
              <br />
              {{ orders.address.lga }},
              <br />
              {{ orders.address.state }}.
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <table style="margin-top: 48px" class="orders">
      <thead>
        <tr>
          <td
            style="padding: 10px; background-color: #f7f9fc"
            class="table-head"
          >
            No.
          </td>
          <td
            style="padding: 10px; background-color: #f7f9fc"
            class="table-head"
          >
            Item
          </td>
          <td
            style="padding: 10px; background-color: #f7f9fc"
            class="table-head"
          >
            Qty
          </td>
          <td
            style="padding: 10px; background-color: #f7f9fc"
            class="table-head"
          >
            Rate
          </td>
          <td
            style="padding: 10px; background-color: #f7f9fc"
            class="table-head"
          >
            Price
          </td>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="({ product, quantity, unit }, index) in orders.products"
          :key="product._id"
        >
          <td class="orders-data">{{ index + 1 }}</td>
          <td class="orders-data">
            {{ product.name }}
          </td>
          <td v-if="product.version === 'v2'" class="orders-data">
            {{ quantity }}
            {{ unit }}
          </td>
          <td v-else class="orders-data">
            {{ unit }}
          </td>
          <td v-if="product.version === 'v2'" class="orders-data">
            <span class="naira">NGN </span>
            {{
              formatPriceWithCommas(calcUnitPrice({ product, quantity, unit }))
            }}
          </td>
          <td v-else class="orders-data">
            <span class="naira">NGN </span>
            {{ formatPriceWithCommas(product.discountPrice || 0) }}
          </td>
          <td class="orders-data">
            <span class="naira">NGN </span>
            {{
              formatPriceWithCommas(
                calcUnitPrice({ product, quantity, unit }) * quantity,
              )
            }}
          </td>
        </tr>
      </tbody>
    </table>

    <table style="max-width: 90%; width: 100%; margin-top: 16px">
      <tbody>
        <tr>
          <td class="receipt-wrap">
            <table class="receipt" style="background: none">
              <tbody>
                <tr>
                  <td
                    style="
                      height: 32px;
                      padding-bottom: 8px;
                      border-bottom: 1px solid #e4e7ec;
                    "
                  >
                    Subtotal
                  </td>
                  <td
                    style="
                      height: 32px;
                      padding-bottom: 8px;
                      border-bottom: 1px solid #e4e7ec;
                    "
                    class="right"
                  >
                    <b>
                      <span class="naira">NGN </span>
                      {{
                        formatPriceWithCommas(
                          orders.totalPrice -
                            (orders.serviceCharge + orders.deliveryFee),
                        )
                      }}
                    </b>
                  </td>
                </tr>
                <tr>
                  <td
                    style="
                      height: 32px;
                      padding-top: 8px;
                      padding-bottom: 8px;
                      border-bottom: 1px solid #e4e7ec;
                    "
                  >
                    Market runs
                    <span v-if="orders.coupon">(coupon was used)</span>
                  </td>
                  <td
                    style="
                      height: 32px;
                      padding-top: 8px;
                      padding-bottom: 8px;
                      border-bottom: 1px solid #e4e7ec;
                    "
                    class="right"
                  >
                    <template v-if="orders.coupon">
                      <b><span class="naira">NGN </span> 0</b>
                    </template>
                    <template v-else>
                      <b>
                        <span class="naira">NGN </span>
                        {{ formatPriceWithCommas(orders.deliveryFee || 0) }}
                      </b>
                    </template>
                  </td>
                </tr>
                <tr>
                  <td
                    style="
                      height: 32px;
                      padding-top: 8px;
                      padding-bottom: 8px;
                      border-bottom: 1px solid #e4e7ec;
                    "
                  >
                    Service charge
                  </td>
                  <td
                    style="
                      height: 32px;
                      padding-top: 8px;
                      padding-bottom: 8px;
                      border-bottom: 1px solid #e4e7ec;
                    "
                    class="right"
                  >
                    <b>
                      <span class="naira">NGN </span>
                      {{
                        formatPriceWithCommas(
                          roundToTwoDecimalPlaces(orders.serviceCharge || 0),
                        )
                      }}
                    </b>
                  </td>
                </tr>
                <tr>
                  <td style="height: 32px; padding-top: 8px">Total</td>
                  <td style="height: 32px; padding-top: 8px" class="right">
                    <b>
                      <span class="naira">NGN </span>
                      {{ formatPriceWithCommas(orders.totalPrice || 0) }}
                    </b>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>

    <table
      style="
        margin-top: 40px;
        padding-top: 32px;
        padding-bottom: 32px;
        background-color: #f9fafb;
      "
      class="footer"
    >
      <tbody>
        <tr>
          <td
            colspan="2"
            class="content"
            style="
              color: #667185;
              padding-left: 24px;
              padding-bottom: 20px;
              font-weight: bold;
            "
          >
            Terms &amp; Conditions
          </td>
        </tr>
        <tr>
          <td
            colspan="2"
            class="content"
            style="
              margin-top: 4px;
              padding-bottom: 20px;
              padding-right: 24px;
              padding-left: 24px;
            "
          >
            Please note that all goods received in good conditions are not
            eligible for return. All defected goods should not be tampered with
            as we would withdraw them for replacement.
          </td>
        </tr>
        <tr>
          <td
            colspan="2"
            class="content"
            style="
              padding-bottom: 20px;
              padding-right: 24px;
              padding-left: 24px;
            "
          >
            Facing any problems? send a mail to
            <a class="a2" href="mailto:admin@ipc-africa.com">admin@ipc-africa.com</a>
            or call +234 806 858 0685
          </td>
        </tr>
        <tr>
          <td
            colspan="2"
            class="content"
            style="
              padding-bottom: 20px;
              padding-right: 24px;
              padding-left: 24px;
            "
          >
            3D Dr. Adewale Oshin Street, Off Chief Collins Uchidiuno St, Lekki
            Phase 1 105102, Lekki, Lagos
          </td>
        </tr>
        <tr>
          <td
            colspan="2"
            class="content"
            style="
              padding-bottom: 20px;
              padding-right: 24px;
              padding-left: 24px;
            "
          >
            Copyright©2023 Independent purchasing company | All rights reserved.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { InvoiceOrderPayload, InvoiceOrderProductLine } from '~/lib/order-invoice-payload';

defineProps<{ orders: InvoiceOrderPayload }>();

function formatDates(dateTimeString: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(dateTimeString));
}

function formatTimeWithAMPM(isoString: string) {
  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(new Date(isoString));
}

function roundToTwoDecimalPlaces(num: number | undefined) {
  if (!num) {
    return 0;
  }

  return parseFloat(num.toFixed(2));
}

function formatPriceWithCommas(price: number | undefined) {
  return price ? price.toLocaleString() : '0';
}

function parseString(value: unknown): Record<string, number> {
  if (typeof value !== 'string' || !value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as Record<string, number>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

const calcUnitPrice = (item: Partial<InvoiceOrderProductLine>) => {
  if (!item.product) {
    return 0;
  }

  let unitData: Record<string, number>;
  if (item.product.discountedUnit) {
    unitData = parseString(item.product.discountedUnit);
  } else {
    unitData = parseString(item.product.unit);
  }

  const price = unitData[item.unit as string];
  if (Number.isNaN(price)) {
    return item.product.discountPrice;
  }

  return price;
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');

*,
** {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    'system-ui',
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  background-color: #ffffff;
  color: #101928;
}

.table-head {
  color: #667185;
  padding-bottom: 4px;
}

.table-data {
  color: #101928;
}

table {
  font-family:
    'system-ui',
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  width: 100%;
  margin: 0 auto;
}

td,
th {
  font-family:
    'system-ui',
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  text-align: left;
  font-weight: 400;
  line-height: 21px;
  letter-spacing: -0.2px;
  color: #101928;
  font-size: 12px;
}

.logo {
  background-color: #09420c;
  color: #fff;
  padding: 24px;
  font-size: 20px;
  font-weight: bold;
  margin-left: 0;
  font-family:
    'system-ui',
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
}

a {
  font-family:
    'system-ui',
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  color: #19b820;
}

.footer td {
  font-family:
    'system-ui',
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  font-size: 0.8em;
}

.content a {
  font-family:
    'system-ui',
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif;
  color: #09420c;
}

.user-details th,
.user-details td {
  width: 25%;
}

.user-details {
  max-width: 90%;
  width: 100%;
  margin: 0 auto;
}

.user-details td {
  word-wrap: break-word;
}

.orders {
  max-width: 90%;
  width: 100%;
  border-collapse: collapse;
}

.orders-data {
  padding: 10px;
  border-bottom: 1px solid #f0f2f5;
}

.receipt {
  border-collapse: collapse;
}

.receipt td {
  margin: 0;
  padding: 0;
  width: 100%;
}

.receipt td b {
  text-overflow: ellipsis;
  font-weight: 500;
}

.receipt-wrap {
  max-width: 90%;
  width: 100%;
  border-radius: 12px;
  border: 1px solid #e4e7ec;
  background: #f7f9fc;
  padding: 8px 12px;
}

.right {
  text-align: right;
  white-space: nowrap;
}

.orders tr:last-child td {
  border-bottom: none;
}
</style>
