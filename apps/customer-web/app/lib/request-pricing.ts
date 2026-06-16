import type { RequestCouponDetails, RequestRecord } from '@gosource/api-client';

export function isFreeDeliveryCoupon(
  couponDetails: RequestCouponDetails | null | undefined,
): boolean {
  return couponDetails?.type === 'FREE_DELIVERY';
}

/** Discount amount that should reduce the payable total. */
export function resolveBillableDiscount(
  request: Pick<RequestRecord, 'discount' | 'couponDetails'>,
): number {
  if (isFreeDeliveryCoupon(request.couponDetails)) {
    return 0;
  }

  return request.discount ?? 0;
}

export function resolveRequestTotalPrice(input: {
  subtotal: number;
  deliveryFee: number;
  serviceCharge: number;
  discount: number;
  couponDetails?: RequestCouponDetails | null;
}): number {
  const billableDiscount = isFreeDeliveryCoupon(input.couponDetails)
    ? 0
    : input.discount;

  return (
    input.subtotal + input.deliveryFee + input.serviceCharge - billableDiscount
  );
}
