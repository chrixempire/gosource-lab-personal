/**
 * App-wide counter bumped whenever a new order arrives over SSE (see
 * `useOrderSound`). List pages watch it to refresh their data live without a
 * manual reload.
 */
export function useNewOrderSignal() {
  return useState<number>('admin-new-order-signal', () => 0);
}
