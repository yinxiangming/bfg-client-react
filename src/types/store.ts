export type ProductType = {
  id: number
  name: string
  slug: string
  sku: string
  product_type: string
  short_description: string
  price: string
  compare_price: string | null
  primary_image: string | null
  category_names: string[]
  is_active: boolean
  is_featured: boolean
  stock_quantity: number
  language: string
}

