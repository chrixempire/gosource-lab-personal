import {
  applyCustomerThemeToDocument,
  resolveCustomerThemePreference,
} from '~/lib/customer-theme';

export default defineNuxtPlugin({
  name: 'customer-theme',
  enforce: 'pre',
  setup() {
    const resolved = resolveCustomerThemePreference();
    applyCustomerThemeToDocument(resolved);
  },
});
