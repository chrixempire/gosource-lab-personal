export interface NewProductInterface {
  name: string;
  description: string;
  actualPrice: number;
  discountPrice: number;
  inStock: boolean;
  brand: string;
  unit: string;
  category: string;
  imageUpdates: any;
  imagesToRemove: any;
}

export interface DateRange {
  start: Date | string;
  end: Date | string;
  startTime?: string;
  endTime?: string;
}
