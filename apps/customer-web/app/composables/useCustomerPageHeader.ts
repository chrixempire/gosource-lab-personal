export type CustomerPageHeaderState = {
  title?: string | null;
};

export function useCustomerPageHeader() {
  const header = useState<CustomerPageHeaderState>('customer-page-header', () => ({}));

  function setPageTitle(title: string | null) {
    header.value = { title };
  }

  function clearPageHeader() {
    header.value = {};
  }

  return { header, setPageTitle, clearPageHeader };
}

export function creditRequestDetailPageTitle(requestType: string) {
  return `Credit details (${requestType === 'topup' ? 'Top-up' : 'New request'})`;
}
