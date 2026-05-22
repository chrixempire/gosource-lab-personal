export interface InitializePaystackPaymentInterface {
  amount: number;
  email: string;
  metadata: string;
  reference: string;
}

export interface INuban {
  first_name: string;
  last_name: string;
  phone: string;
  preferred_bank: string;
  country: string;
  email: string;
}
