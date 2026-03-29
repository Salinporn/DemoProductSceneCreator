export interface StoreProduct {
  id: string | number;
  name: string;
  description?: string;
  category?: string;
  product_type?: string;
  digital_price?: string | null;
  physical_price?: string | null;
  image?: string | null;
  rating?: number;
  display_scenes_ids?: number[];
  model_id?: number;
  digital_available?: boolean;
  physical_available?: boolean;
}
