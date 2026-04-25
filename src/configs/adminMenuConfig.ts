export interface MenuItem {
  label: string
  href: string
  icon?: string
  permission?: string
  requireAdmin?: boolean
  children?: MenuItem[]
}

export const adminMenuConfig: MenuItem[] = [
  { label: '仪表盘', href: '/admin', icon: 'LayoutDashboard' },

  { label: '商品管理', href: '/admin/store/products', icon: 'Package', permission: 'shop.product.view' },
  { label: '订单管理', href: '/admin/store/orders', icon: 'ShoppingCart', permission: 'shop.order.view' },
  { label: '客户管理', href: '/admin/store/customers', icon: 'Users', permission: 'shop.customer.view' },

  { label: '配送管理', href: '/admin/settings/delivery', icon: 'Truck', permission: 'delivery.view' },

  { label: '营销活动', href: '/admin/store/marketing', icon: 'Megaphone', permission: 'marketing.view' },

  { label: '财务', href: '/admin/store/finance', icon: 'CreditCard', permission: 'finance.invoice.view' },

  { label: '员工管理', href: '/admin/staff', icon: 'UserCog', requireAdmin: true },
  { label: '角色权限', href: '/admin/staff/roles', icon: 'Shield', requireAdmin: true },
  { label: '系统设置', href: '/admin/settings', icon: 'Settings', requireAdmin: true },
]
