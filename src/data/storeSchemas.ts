// Store-specific schemas
import type { SchemaResponse } from '@/types/schema'

// Orders Schema
export const orderSchema: SchemaResponse = {
  list: {
    title: 'Orders',
    columns: [
      { 
        field: 'order_number', 
        label: 'Order No', 
        type: 'string', 
        sortable: true,
        render: (value: any) => value || '-'
      },
      { 
        field: 'customer', 
        label: 'Customer', 
        type: 'string', 
        sortable: true,
        render: (value: any, row: any) => {
          return row.customer_name || value || '-'
        }
      },
      { 
        field: 'store', 
        label: 'Store', 
        type: 'string',
        render: (value: any, row: any) => {
          return row.store_name || value || '-'
        }
      },
      { field: 'total', label: 'Total', type: 'currency', sortable: true },
      { field: 'status', label: 'Status', type: 'select', sortable: true },
      { field: 'payment_status', label: 'Payment Status', type: 'select' },
      { field: 'created_at', label: 'Created At', type: 'datetime', sortable: true }
    ],
    filters: [
      {
        field: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'paid', label: 'Paid' },
          { value: 'shipped', label: 'Shipped' },
          { value: 'completed', label: 'Completed' },
          { value: 'cancelled', label: 'Cancelled' }
        ]
      },
      {
        field: 'payment_status',
        label: 'Payment Status',
        type: 'select',
        options: [
          { value: 'pending', label: 'Pending' },
          { value: 'paid', label: 'Paid' },
          { value: 'failed', label: 'Failed' }
        ]
      }
    ],
    searchFields: ['order_number', 'customer_name'],
    actions: [
      { id: 'view', label: 'View', type: 'secondary', scope: 'row' },
      { id: 'edit', label: 'Edit', type: 'secondary', scope: 'row' }
    ]
  },
  form: {
    title: 'Order Details',
    fields: [
      { field: 'order_number', label: 'Order No', type: 'string', required: true, readonly: true },
      { field: 'customer', label: 'Customer', type: 'select', required: true, optionsSource: 'api', optionsApi: '/api/v2/bfg/common/customers/' },
      { field: 'store', label: 'Store', type: 'select', required: true, optionsSource: 'api', optionsApi: '/api/v2/bfg/store/stores/' },
      { field: 'status', label: 'Status', type: 'select', required: true },
      { field: 'payment_status', label: 'Payment Status', type: 'select', required: true },
      { field: 'total', label: 'Total', type: 'currency', required: true }
    ],
    actions: [
      { id: 'submit', label: 'Save', type: 'submit' },
      { id: 'cancel', label: 'Cancel', type: 'cancel' }
    ]
  }
}

// Stores Schema
export const storesSchema: SchemaResponse = {
  list: {
    title: 'Stores',
    columns: [
      { field: 'name', label: 'Name', type: 'string', sortable: true, link: 'edit' },
      { field: 'code', label: 'Code', type: 'string', sortable: true },
      { field: 'description', label: 'Description', type: 'string' },
      { field: 'is_active', label: 'Status', type: 'boolean', sortable: true },
      { field: 'created_at', label: 'Created At', type: 'datetime', sortable: true }
    ],
    searchFields: ['name', 'code'],
    actions: [
      { id: 'add', label: 'Add Store', type: 'primary', scope: 'global', icon: 'tabler-plus' },
      { id: 'edit', label: 'Edit', type: 'secondary', scope: 'row', icon: 'tabler-edit' },
      { id: 'delete', label: 'Delete', type: 'danger', scope: 'row', icon: 'tabler-trash', confirm: 'Are you sure you want to delete this store?' }
    ]
  },
  form: {
    title: 'Store Details',
    fields: [
      { field: 'name', label: 'Name', type: 'string', required: true },
      { field: 'code', label: 'Code', type: 'string', required: true },
      { field: 'description', label: 'Description', type: 'textarea' },
      { field: 'warehouses', label: 'Warehouses', type: 'select', optionsSource: 'api', optionsApi: '/api/v2/bfg/delivery/warehouses/', multiple: true },
      { field: 'is_active', label: 'Active', type: 'boolean', defaultValue: true, newline: true },
      { field: 'created_at', label: 'Created At', type: 'datetime', readonly: true, format: 'datetime' },
      { field: 'updated_at', label: 'Updated At', type: 'datetime', readonly: true, format: 'datetime' }
    ],
    actions: [
      { id: 'submit', label: 'Save', type: 'submit' },
      { id: 'cancel', label: 'Cancel', type: 'cancel' }
    ]
  }
}

// Products Schema
export const productsSchema: SchemaResponse = {
  list: {
    title: 'Products',
    columns: [
      {
        field: 'name',
        label: 'Product',
        type: 'string',
        sortable: true,
        link: 'edit'
      },
      {
        field: 'category_names',
        label: 'Category',
        type: 'string',
        sortable: true,
        render: (value: any) => {
          const category = Array.isArray(value) && value.length > 0 ? value[0] : 'Uncategorized'
          return category
        }
      },
      {
        field: 'sku',
        label: 'SKU',
        type: 'string',
        sortable: true
      },
      {
        field: 'price',
        label: 'Price',
        type: 'string',
        sortable: true,
        render: (value: any) => {
          return value ? `$${value}` : '-'
        }
      },
      {
        field: 'stock_quantity',
        label: 'QTY',
        type: 'number',
        sortable: true,
        render: (value: any) => value || 0
      },
      {
        field: 'is_active',
        label: 'Published',
        type: 'boolean',
        sortable: true,
        render: (value: any) => {
          return value ? 'Published' : 'Inactive'
        }
      }
    ],
    filters: [
      {
        field: 'is_active',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'true', label: 'Published' },
          { value: 'false', label: 'Inactive' }
        ]
      },
      {
        field: 'is_featured',
        label: 'Featured',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' }
        ]
      }
    ],
    searchFields: ['name', 'sku', 'product_type'],
    searchPlaceholder: 'Search products...',
    actions: [
      {
        id: 'add',
        label: 'Add Product',
        type: 'primary',
        scope: 'global',
        icon: 'tabler-plus'
      },
      { id: 'edit', label: 'Edit', type: 'secondary', scope: 'row' },
      {
        id: 'delete',
        label: 'Delete',
        type: 'danger',
        scope: 'row',
        confirm: 'Are you sure you want to delete this product?'
      }
    ]
  },
  form: {
    title: 'Product Details',
    fields: [
      { field: 'name', label: 'Product Name', type: 'string', required: true },
      { field: 'sku', label: 'SKU', type: 'string', required: true },
      { field: 'product_type', label: 'Product Type', type: 'string' },
      { field: 'short_description', label: 'Short Description', type: 'textarea' },
      { field: 'price', label: 'Price', type: 'string', required: true },
      { field: 'compare_price', label: 'Compare Price', type: 'string' },
      { field: 'stock_quantity', label: 'Stock Quantity', type: 'number' },
      { field: 'is_active', label: 'Is Active', type: 'boolean' },
      { field: 'is_featured', label: 'Is Featured', type: 'boolean' }
    ],
    actions: [
      { id: 'submit', label: 'Save', type: 'submit' },
      { id: 'cancel', label: 'Cancel', type: 'cancel' }
    ]
  }
}

// Categories Schema
// Based on server: bfg2/bfg/shop/models/category.py ProductCategory and ProductCategorySerializer
export const categoriesSchema: SchemaResponse = {
  form: {
    title: 'Category Details',
    fields: [
      { 
        field: 'name', 
        label: 'Name', 
        type: 'string', 
        required: true,
        validation: { max: 100, message: 'Name must be 100 characters or less' }
      },
      { 
        field: 'slug', 
        label: 'Slug', 
        type: 'string', 
        required: true,
        validation: { max: 100, message: 'Slug must be 100 characters or less' }
      },
      { 
        field: 'parent', 
        label: 'Parent Category', 
        type: 'select',
        optionsSource: 'api',
        optionsApi: '/api/v1/categories/?language=en',
        optionsValueField: 'id',
        optionsLabelField: 'name'
      },
      { 
        field: 'description', 
        label: 'Description', 
        type: 'textarea',
        rows: 4
      },
      { 
        field: 'icon', 
        label: 'Icon', 
        type: 'string',
        placeholder: 'e.g., tabler-home',
        helperText: 'Icon class name or emoji (max 50 characters)',
        validation: { max: 50, message: 'Icon must be 50 characters or less' }
      },
      { 
        field: 'order', 
        label: 'Order', 
        type: 'number',
        defaultValue: 100,
        validation: { min: 0, message: 'Order must be 0 or greater' }
      },
      { 
        field: 'is_active', 
        label: 'Is Active', 
        type: 'boolean',
        defaultValue: true
      },
      { 
        field: 'language', 
        label: 'Language', 
        type: 'string',
        defaultValue: 'en',
        required: true,
        validation: { max: 10, message: 'Language must be 10 characters or less' }
      }
    ],
    actions: [
      { id: 'submit', label: 'Save', type: 'submit' },
      { id: 'cancel', label: 'Cancel', type: 'cancel' }
    ]
  }
}

