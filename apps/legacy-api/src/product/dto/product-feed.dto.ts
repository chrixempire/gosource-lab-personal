export interface ProductFeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  availability: string;
  condition: string;
  price: string;
  sale_price?: string;
  brand: string;
  product_type: string;
  google_product_category?: string;
}

export interface ProductFeedOptions {
  baseUrl?: string;
  currency?: string;
  defaultGoogleCategory?: string;
  storeName?: string;
  storeDescription?: string;
}
