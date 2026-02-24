'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Divider from '@mui/material/Divider'

// Service Imports
import {
  getPackageTemplates,
  getOrderPackages,
  createOrderPackage,
  updateOrderPackage,
  deleteOrderPackage,
  getShippingOptions,
  shipOrder,
  getOrderConsignments,
  getConsignmentLabel,
  deleteConsignment,
  type PackageTemplate,
  type OrderPackage,
  type Carrier,
  type ShippingOption,
  type ConsignmentListItem,
  type OrderPackagePayload,
  type Warehouse,
  type PickupAddress
} from '@/services/shipping'

// Context Imports
import { useBaseData } from '@/contexts/BaseDataContext'

type OrderPackageData = {
  id: number
  package_number: string
  template: number | null
  template_name: string | null
  length: number
  width: number
  height: number
  weight: number
  quantity: number  // maps to 'pieces' field
  volumetric_weight: number
  billing_weight: number
  total_billing_weight: number
  description: string
  notes: string
}

type AddressInfo = {
  id?: number
  full_name?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  phone?: string
}

type OrderDetail = {
  id: number
  shipping_cost?: number | string
  total?: number | string
  packages?: OrderPackageData[]
  shipping_address?: AddressInfo
}

type PackagesCardProps = {
  order: OrderDetail
  onOrderUpdate?: () => void
}

// Cookie helper functions
const CARRIER_COOKIE_KEY = 'packgo_selected_carrier'
const WAREHOUSE_COOKIE_KEY = 'packgo_selected_warehouse'

const getSelectedCarrierFromCookie = (): number | null => {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + CARRIER_COOKIE_KEY + '=([^;]+)'))
  return match ? parseInt(match[2], 10) : null
}

const setSelectedCarrierToCookie = (carrierId: number) => {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `${CARRIER_COOKIE_KEY}=${carrierId};expires=${expires.toUTCString()};path=/`
}

const getSelectedWarehouseFromCookie = (): number | null => {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + WAREHOUSE_COOKIE_KEY + '=([^;]+)'))
  return match ? parseInt(match[2], 10) : null
}

const setSelectedWarehouseToCookie = (warehouseId: number) => {
  if (typeof document === 'undefined') return
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)
  document.cookie = `${WAREHOUSE_COOKIE_KEY}=${warehouseId};expires=${expires.toUTCString()};path=/`
}

const PackagesCard = ({ order, onOrderUpdate }: PackagesCardProps) => {
  const t = useTranslations('admin')
  // Get base data from context
  const { carriers, warehouses } = useBaseData()
  
  const [packages, setPackages] = useState<OrderPackageData[]>([])
  const [templates, setTemplates] = useState<PackageTemplate[]>([])
  const [consignments, setConsignments] = useState<ConsignmentListItem[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(false)
  const [shipping, setShipping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<OrderPackageData | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deletingPackage, setDeletingPackage] = useState<OrderPackageData | null>(null)
  const [deleteConsignmentConfirmOpen, setDeleteConsignmentConfirmOpen] = useState(false)
  const [deletingConsignment, setDeletingConsignment] = useState<ConsignmentListItem | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<OrderPackagePayload>({
    template: null,
    length: 0,
    width: 0,
    height: 0,
    weight: 0,
    quantity: 1,
    description: '',
    notes: ''
  })
  
  // Carrier and shipping options state
  const [selectedCarrier, setSelectedCarrier] = useState<number | ''>('')
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedOption, setSelectedOption] = useState<ShippingOption | null>(null)
  const [shippingError, setShippingError] = useState<string | null>(null)
  
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    fetchData()
  }, [order.id])

  // Restore carrier from cookie on mount
  useEffect(() => {
    if (carriers.length > 0 && selectedCarrier === '') {
      const savedCarrierId = getSelectedCarrierFromCookie()
      if (savedCarrierId && carriers.find(c => c.id === savedCarrierId)) {
        setSelectedCarrier(savedCarrierId)
      }
    }
  }, [carriers])

  // Restore warehouse from cookie on mount
  useEffect(() => {
    const activeWarehouses = warehouses.filter(w => w.is_active)
    if (activeWarehouses.length > 0 && selectedWarehouse === '') {
      const savedWarehouseId = getSelectedWarehouseFromCookie()
      if (savedWarehouseId && activeWarehouses.find(w => w.id === savedWarehouseId)) {
        setSelectedWarehouse(savedWarehouseId)
      } else {
        // Select default warehouse
        const defaultWarehouse = activeWarehouses.find(w => w.is_default) || activeWarehouses[0]
        if (defaultWarehouse) {
          setSelectedWarehouse(defaultWarehouse.id)
        }
      }
    }
  }, [warehouses, selectedWarehouse])

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Load consignments (carriers and warehouses come from context)
      const consignmentsData = await getOrderConsignments(order.id)
      setConsignments(consignmentsData)
      
      // Use packages from order if available, otherwise fetch
      if (order.packages) {
        setPackages(order.packages)
      } else {
        const packagesData = await getOrderPackages(order.id)
        setPackages(packagesData)
      }
    } catch (err) {
      setError(t('orders.packages.errors.loadData'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Refresh only packages and consignments (used after create/update/delete)
  const refreshPackages = async () => {
    try {
      const [packagesData, consignmentsData] = await Promise.all([
        getOrderPackages(order.id),
        getOrderConsignments(order.id)
      ])
      setPackages(packagesData)
      setConsignments(consignmentsData)
    } catch (err) {
      console.error('Failed to refresh packages:', err)
    }
  }

  const loadTemplates = async () => {
    if (templates.length > 0) return // Already loaded
    
    setLoadingTemplates(true)
    try {
      const templatesData = await getPackageTemplates()
      setTemplates(templatesData)
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleOpenAddDialog = () => {
    setEditingPackage(null)
    setFormData({
      template: null,
      length: 0,
      width: 0,
      height: 0,
      weight: 0,
      quantity: 1,
      description: '',
      notes: ''
    })
    setDialogOpen(true)
    loadTemplates()
  }

  const handleOpenEditDialog = (pkg: OrderPackageData) => {
    setEditingPackage(pkg)
    setFormData({
      template: pkg.template,
      length: pkg.length,
      width: pkg.width,
      height: pkg.height,
      weight: pkg.weight,
      quantity: pkg.quantity,
      description: pkg.description,
      notes: pkg.notes
    })
    setDialogOpen(true)
    loadTemplates()
  }

  const handleTemplateChange = (templateId: number | '') => {
    if (templateId === '') {
      setFormData(prev => ({ ...prev, template: null }))
      return
    }
    
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setFormData(prev => ({
        ...prev,
        template: template.id,
        length: template.length,
        width: template.width,
        height: template.height
      }))
    }
  }

  const handleSavePackage = async () => {
    if (!formData.weight || formData.weight <= 0) {
      setSnackbar({ open: true, message: t('orders.packages.validation.weightRequired'), severity: 'error' })
      return
    }
    
    if (!formData.length || !formData.width || !formData.height) {
      setSnackbar({ open: true, message: t('orders.packages.validation.dimensionsRequired'), severity: 'error' })
      return
    }

    setSaving(true)
    try {
      if (editingPackage) {
        await updateOrderPackage(editingPackage.id, formData)
        setSnackbar({ open: true, message: t('orders.packages.snackbar.packageUpdated'), severity: 'success' })
      } else {
        await createOrderPackage({ ...formData, order: order.id })
        setSnackbar({ open: true, message: t('orders.packages.snackbar.packageAdded'), severity: 'success' })
      }
      setDialogOpen(false)
      // Only refresh packages and consignments, not carriers/warehouses
      await refreshPackages()
      // Delay order update to avoid triggering multiple component refreshes
      // Only update if order data might have changed (shipping cost, etc.)
      setTimeout(() => {
        onOrderUpdate?.()
      }, 100)
    } catch (err) {
      setSnackbar({ open: true, message: t('orders.packages.errors.savePackage'), severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePackage = async () => {
    if (!deletingPackage) return
    
    setSaving(true)
    try {
      await deleteOrderPackage(deletingPackage.id)
      setSnackbar({ open: true, message: t('orders.packages.snackbar.packageDeleted'), severity: 'success' })
      setDeleteConfirmOpen(false)
      setDeletingPackage(null)
      // Only refresh packages and consignments
      await refreshPackages()
      // Delay order update to avoid triggering multiple component refreshes
      setTimeout(() => {
        onOrderUpdate?.()
      }, 100)
    } catch (err) {
      setSnackbar({ open: true, message: t('orders.packages.errors.deletePackage'), severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleWarehouseChange = (warehouseId: number | '') => {
    setSelectedWarehouse(warehouseId)
    setShippingOptions([])
    setSelectedOption(null)
    setShippingError(null)
    if (warehouseId !== '') {
      setSelectedWarehouseToCookie(warehouseId)
    }
  }

  const handleCarrierChange = (carrierId: number | '') => {
    setSelectedCarrier(carrierId)
    setShippingOptions([])
    setSelectedOption(null)
    if (carrierId !== '') {
      setSelectedCarrierToCookie(carrierId)
    }
  }

  const handleGetShippingOptions = async () => {
    if (!selectedCarrier) {
      setSnackbar({ open: true, message: t('orders.packages.errors.selectCarrier'), severity: 'error' })
      return
    }
    
    if (!selectedWarehouse) {
      setSnackbar({ open: true, message: t('orders.packages.errors.selectPickupWarehouse'), severity: 'error' })
      return
    }
    
    const warehouse = warehouses.find(w => w.id === selectedWarehouse)
    if (!warehouse) {
      setSnackbar({ open: true, message: t('orders.packages.errors.warehouseNotFound'), severity: 'error' })
      return
    }
    
    // Build pickup address from warehouse
    const pickupAddress: PickupAddress = {
      name: warehouse.name,
      address_line1: warehouse.address_line1,
      address_line2: warehouse.address_line2 || undefined,
      city: warehouse.city,
      state: warehouse.state || undefined,
      postal_code: warehouse.postal_code,
      country: warehouse.country,
      phone: warehouse.phone || undefined
    }
    
    setLoadingOptions(true)
    setShippingOptions([])
    setSelectedOption(null)
    setShippingError(null)
    try {
      const result = await getShippingOptions(order.id, selectedCarrier as number, pickupAddress)
      setShippingOptions(result.options || [])
      if (result.options?.length === 0) {
        const selectedCarrierData = carriers.find(c => c.id === selectedCarrier)
        const carrierName = selectedCarrierData?.name || t('orders.packages.shipping.selectedCarrierFallback')
        
        // Build helpful error message
        let errorMsg = t('orders.packages.shipping.noOptions', { carrierName })
        
        // Check for address compatibility issues
        if (warehouse && order.shipping_address) {
          if (warehouse.country !== order.shipping_address.country) {
            errorMsg += ` ${t('orders.packages.shipping.countryMismatchNote', {
              pickupCountry: warehouse.country ?? '',
              deliveryCountry: order.shipping_address.country ?? ''
            })}`
          }
          // Check if it's a NZ carrier but addresses are not in NZ
          if (selectedCarrierData?.carrier_type === 'parcelport' && warehouse.country !== 'NZ') {
            errorMsg += ` ${t('orders.packages.shipping.parcelPortNzOnly')}`
          }
        }
        
        setShippingError(errorMsg)
        setSnackbar({ open: true, message: errorMsg, severity: 'error' })
      }
    } catch (err: any) {
      const errorMsg = err.message || t('orders.packages.errors.getShippingOptions')
      setShippingError(errorMsg)
      setSnackbar({ open: true, message: errorMsg, severity: 'error' })
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleShipOrder = async () => {
    if (!selectedCarrier || !selectedOption) {
      setSnackbar({ open: true, message: t('orders.packages.errors.selectShippingOption'), severity: 'error' })
      return
    }
    
    setShipping(true)
    try {
      const result = await shipOrder(
        order.id, 
        selectedCarrier as number, 
        selectedOption.service_code,
        selectedOption.service_name,
        selectedOption.price
      )
      
      if (result.success) {
        setSnackbar({ 
          open: true, 
          message: t('orders.packages.snackbar.consignmentCreated', { number: result.tracking_number || result.consignment_number || '' }), 
          severity: 'success' 
        })
        setShippingOptions([])
        setSelectedOption(null)
        // Refresh only consignments
        const consignmentsData = await getOrderConsignments(order.id)
        setConsignments(consignmentsData)
        // Delay order update to avoid triggering multiple component refreshes
        setTimeout(() => {
          onOrderUpdate?.()
        }, 100)
      } else {
        setSnackbar({ open: true, message: result.error || t('orders.packages.errors.createShipment'), severity: 'error' })
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || t('orders.packages.errors.shipOrder'), severity: 'error' })
    } finally {
      setShipping(false)
    }
  }

  const handlePrintLabel = async (consignmentNumber: string) => {
    try {
      const result = await getConsignmentLabel(consignmentNumber)
      if (result.success && result.label_url) {
        window.open(result.label_url, '_blank')
      } else {
        setSnackbar({ open: true, message: result.error || t('orders.packages.errors.getLabel'), severity: 'error' })
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || t('orders.packages.errors.getLabel'), severity: 'error' })
    }
  }

  const handleDeleteConsignment = async () => {
    if (!deletingConsignment) return
    
    setSaving(true)
    try {
      await deleteConsignment(deletingConsignment.id)
      setSnackbar({ open: true, message: t('orders.packages.snackbar.consignmentDeleted'), severity: 'success' })
      setDeleteConsignmentConfirmOpen(false)
      setDeletingConsignment(null)
      // Refresh only consignments
      const consignmentsData = await getOrderConsignments(order.id)
      setConsignments(consignmentsData)
      // Delay order update to avoid triggering multiple component refreshes
      setTimeout(() => {
        onOrderUpdate?.()
      }, 100)
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || t('orders.packages.errors.deleteConsignment'), severity: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Calculate totals
  const totalPackages = packages.reduce((sum, pkg) => sum + (Number(pkg.quantity) || 0), 0)
  const totalActualWeight = packages.reduce((sum, pkg) => {
    const weight = Number(pkg.weight) || 0
    const quantity = Number(pkg.quantity) || 0
    return sum + weight * quantity
  }, 0)
  const totalBillingWeight = packages.reduce((sum, pkg) => sum + (Number(pkg.total_billing_weight) || 0), 0)

  if (loading) {
    return (
      <Card>
        <CardHeader title={t('orders.packages.title')} />
        <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader 
        title={t('orders.packages.title')} 
        action={
          <Button
            variant='contained'
            size='small'
            startIcon={<i className='tabler-plus' />}
            onClick={handleOpenAddDialog}
          >
            {t('orders.packages.addPackage')}
          </Button>
        }
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {error && <Alert severity='error'>{error}</Alert>}
        
        {packages.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color='text.secondary'>
              {t('orders.packages.empty')}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Package Table */}
            <TableContainer component={Paper} variant='outlined'>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('orders.packages.table.template')}</TableCell>
                    <TableCell align='right'>{t('orders.packages.table.dimensions')}</TableCell>
                    <TableCell align='right'>{t('orders.packages.table.weight')}</TableCell>
                    <TableCell align='right'>{t('orders.packages.table.volWeight')}</TableCell>
                    <TableCell align='right'>{t('orders.packages.table.billingWeight')}</TableCell>
                    <TableCell align='center'>{t('orders.packages.table.qty')}</TableCell>
                    <TableCell align='center'>{t('orders.packages.table.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {packages.map(pkg => (
                    <TableRow key={pkg.id}>
                      <TableCell>
                        {pkg.template_name || (
                          <Typography variant='body2' color='text.secondary'>
                            {t('orders.packages.table.custom')}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align='right'>
                        {pkg.length} × {pkg.width} × {pkg.height}
                      </TableCell>
                      <TableCell align='right'>{pkg.weight}</TableCell>
                      <TableCell align='right'>
                        {typeof pkg.volumetric_weight === 'number' 
                          ? pkg.volumetric_weight.toFixed(2) 
                          : (pkg.volumetric_weight ?? '-')}
                      </TableCell>
                      <TableCell align='right'>
                        <Chip 
                          label={
                            typeof pkg.billing_weight === 'number' 
                              ? pkg.billing_weight.toFixed(2) 
                              : (pkg.billing_weight ?? '-')
                          } 
                          size='small' 
                          color={
                            typeof pkg.billing_weight === 'number' && typeof pkg.weight === 'number' && pkg.billing_weight > pkg.weight 
                              ? 'warning' 
                              : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell align='center'>{pkg.quantity}</TableCell>
                      <TableCell align='center'>
                        <IconButton size='small' onClick={() => handleOpenEditDialog(pkg)}>
                          <i className='tabler-edit' />
                        </IconButton>
                        <IconButton 
                          size='small' 
                          color='error'
                          onClick={() => {
                            setDeletingPackage(pkg)
                            setDeleteConfirmOpen(true)
                          }}
                        >
                          <i className='tabler-trash' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals */}
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1, minWidth: 150 }}>
                <Typography variant='body2' color='text.secondary'>{t('orders.packages.totals.totalPackages')}</Typography>
                <Typography variant='h6'>{totalPackages}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 150 }}>
                <Typography variant='body2' color='text.secondary'>{t('orders.packages.totals.actualWeight')}</Typography>
                <Typography variant='h6'>
                  {typeof totalActualWeight === 'number' && !isNaN(totalActualWeight) 
                    ? totalActualWeight.toFixed(2) 
                    : '0.00'} kg
                </Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 150 }}>
                <Typography variant='body2' color='text.secondary'>{t('orders.packages.totals.billingWeight')}</Typography>
                <Typography variant='h6' color='primary'>
                  {typeof totalBillingWeight === 'number' && !isNaN(totalBillingWeight) 
                    ? totalBillingWeight.toFixed(2) 
                    : '0.00'} kg
                </Typography>
              </Box>
            </Box>

            <Divider />

            {/* Consignments List */}
            {consignments.length > 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant='subtitle2'>{t('orders.packages.consignments.title')}</Typography>
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('orders.packages.consignments.table.consignmentNumber')}</TableCell>
                        <TableCell>{t('orders.packages.consignments.table.trackingNumber')}</TableCell>
                        <TableCell>{t('orders.packages.consignments.table.carrier')}</TableCell>
                        <TableCell>{t('orders.packages.consignments.table.status')}</TableCell>
                        <TableCell align='center'>{t('orders.packages.consignments.table.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {consignments.map(con => (
                        <TableRow key={con.id}>
                          <TableCell>{con.consignment_number}</TableCell>
                          <TableCell>
                            {con.tracking_number || (
                              <Typography variant='body2' color='text.secondary'>-</Typography>
                            )}
                          </TableCell>
                          <TableCell>{con.carrier_name}</TableCell>
                          <TableCell>
                            <Chip label={con.status_name || con.state} size='small' />
                          </TableCell>
                          <TableCell align='center'>
                            <IconButton 
                              size='small' 
                              color='primary'
                              onClick={() => handlePrintLabel(con.consignment_number)}
                              title={t('orders.packages.consignments.actions.printLabel')}
                            >
                              <i className='tabler-file-type-pdf' />
                            </IconButton>
                            <IconButton 
                              size='small' 
                              color='error'
                              onClick={() => {
                                setDeletingConsignment(con)
                                setDeleteConsignmentConfirmOpen(true)
                              }}
                              title={t('orders.packages.consignments.actions.deleteConsignment')}
                            >
                              <i className='tabler-trash' />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            <Divider />

            {/* Shipping Addresses */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant='subtitle2'>{t('orders.packages.addresses.title')}</Typography>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {/* Pickup Address (Warehouse) */}
                <Box sx={{ flex: 1, minWidth: 280, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant='caption' color='text.secondary' fontWeight={600}>
                    {t('orders.packages.addresses.fromPickup')}
                  </Typography>
                  <FormControl fullWidth size='small' sx={{ mt: 1 }}>
                    <InputLabel>{t('orders.packages.addresses.selectWarehouse')}</InputLabel>
                    <Select
                      value={selectedWarehouse}
                      label={t('orders.packages.addresses.selectWarehouse')}
                      onChange={(e) => handleWarehouseChange(e.target.value as number | '')}
                    >
                      <MenuItem value=''>{t('orders.packages.addresses.selectPlaceholder')}</MenuItem>
                      {warehouses.filter(w => w.is_active).map(wh => (
                        <MenuItem key={wh.id} value={wh.id}>
                          {wh.name} ({wh.country}) {wh.is_default && '⭐'}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {selectedWarehouse && (() => {
                    const wh = warehouses.find(w => w.id === selectedWarehouse)
                    return wh ? (
                      <Box sx={{ mt: 1.5, pl: 0.5 }}>
                        <Typography variant='body2' color='text.secondary'>{wh.address_line1}</Typography>
                        {wh.address_line2 && (
                          <Typography variant='body2' color='text.secondary'>{wh.address_line2}</Typography>
                        )}
                        <Typography variant='body2' color='text.secondary'>
                          {wh.city}, {wh.state} {wh.postal_code}
                        </Typography>
                        <Typography variant='body2' color='text.secondary' fontWeight={500}>{wh.country}</Typography>
                      </Box>
                    ) : null
                  })()}
                  {warehouses.filter(w => w.is_active).length === 0 && (
                    <Typography variant='body2' color='error' sx={{ mt: 1 }}>
                      {t('orders.packages.addresses.noWarehouseConfigured')}
                    </Typography>
                  )}
                </Box>

                {/* Delivery Address (Order Shipping Address) */}
                <Box sx={{ flex: 1, minWidth: 280, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant='caption' color='text.secondary' fontWeight={600}>
                    {t('orders.packages.addresses.toDelivery')}
                  </Typography>
                  {order.shipping_address ? (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant='body2' fontWeight={500}>{order.shipping_address.full_name}</Typography>
                      <Typography variant='body2' color='text.secondary'>{order.shipping_address.address_line1}</Typography>
                      {order.shipping_address.address_line2 && (
                        <Typography variant='body2' color='text.secondary'>{order.shipping_address.address_line2}</Typography>
                      )}
                      <Typography variant='body2' color='text.secondary'>
                        {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                      </Typography>
                      <Typography variant='body2' color='text.secondary' fontWeight={500}>{order.shipping_address.country}</Typography>
                    </Box>
                  ) : (
                    <Typography variant='body2' color='error' sx={{ mt: 1 }}>
                      {t('orders.packages.addresses.noShippingAddress')}
                    </Typography>
                  )}
                </Box>
              </Box>
              
              {/* Address warning if countries don't match carrier requirements */}
              {selectedWarehouse && order.shipping_address && (() => {
                const wh = warehouses.find(w => w.id === selectedWarehouse)
                return wh && wh.country !== order.shipping_address?.country ? (
                  <Alert severity='warning' sx={{ mt: 1 }}>
                    {t('orders.packages.addresses.crossCountryWarning', {
                      fromCountry: wh.country ?? '',
                      toCountry: order.shipping_address.country ?? ''
                    })}
                  </Alert>
                ) : null
              })()}
            </Box>

            <Divider />

            {/* Create Shipment */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant='subtitle2'>{t('orders.packages.shipping.createShipmentTitle')}</Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 200 }} size='small'>
                  <InputLabel>{t('orders.packages.shipping.carrierLabel')}</InputLabel>
                  <Select
                    value={selectedCarrier}
                    label={t('orders.packages.shipping.carrierLabel')}
                    onChange={(e) => handleCarrierChange(e.target.value as number | '')}
                  >
                    <MenuItem value=''>{t('orders.packages.addresses.selectPlaceholder')}</MenuItem>
                    {carriers.map(carrier => (
                      <MenuItem key={carrier.id} value={carrier.id}>
                        {carrier.name} {carrier.is_test_mode ? t('orders.packages.shipping.testModeTag') : null}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <Button
                  variant='outlined'
                  onClick={handleGetShippingOptions}
                  disabled={loadingOptions || !selectedCarrier}
                >
                  {loadingOptions ? <CircularProgress size={20} /> : t('orders.packages.shipping.getShippingOptions')}
                </Button>
              </Box>

              {/* Shipping Error */}
              {shippingError && (
                <Alert severity='error' onClose={() => setShippingError(null)}>
                  {shippingError}
                </Alert>
              )}

              {/* Shipping Options */}
              {shippingOptions.length > 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography variant='body2' color='text.secondary'>
                    {t('orders.packages.shipping.optionsPrompt')}
                  </Typography>
                  <TableContainer component={Paper} variant='outlined'>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell padding='checkbox'></TableCell>
                          <TableCell>{t('orders.packages.shipping.table.carrier')}</TableCell>
                          <TableCell>{t('orders.packages.shipping.table.service')}</TableCell>
                          <TableCell align='right'>{t('orders.packages.shipping.table.price')}</TableCell>
                          <TableCell align='right'>{t('orders.packages.shipping.table.estDays')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {shippingOptions.map((opt, idx) => (
                          <TableRow 
                            key={idx}
                            hover
                            selected={selectedOption?.service_code === opt.service_code}
                            onClick={() => setSelectedOption(opt)}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell padding='checkbox'>
                              <input
                                type='radio'
                                checked={selectedOption?.service_code === opt.service_code}
                                onChange={() => setSelectedOption(opt)}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2' fontWeight={500}>
                                {opt.carrier_name || t('orders.packages.shipping.na')}
                              </Typography>
                              {opt.carrier_method_desc && (
                                <Typography variant='caption' color='text.secondary'>
                                  {opt.carrier_method_desc}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant='body2' fontWeight={500}>
                                {opt.service_name}
                              </Typography>
                              <Typography variant='caption' color='text.secondary'>
                                {opt.service_code}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body2' color='primary' fontWeight={600}>
                                {opt.currency} {opt.price}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              {opt.estimated_days_min === opt.estimated_days_max 
                                ? t('orders.packages.shipping.daysSingle', { days: opt.estimated_days_min })
                                : t('orders.packages.shipping.daysRange', { min: opt.estimated_days_min, max: opt.estimated_days_max })
                              }
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {selectedOption && (
                    <Box sx={{ 
                      bgcolor: 'action.hover', 
                      p: 2, 
                      borderRadius: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <Box>
                        <Typography variant='body2' color='text.secondary'>
                          {t('orders.packages.shipping.selected', { serviceName: selectedOption.service_name })}
                        </Typography>
                        <Typography variant='h6' color='primary'>
                          {selectedOption.currency} {selectedOption.price}
                        </Typography>
                      </Box>
                      <Button
                        variant='contained'
                        color='primary'
                        onClick={handleShipOrder}
                        disabled={shipping}
                        startIcon={shipping ? <CircularProgress size={16} /> : <i className='tabler-truck-delivery' />}
                      >
                        {t('orders.packages.shipping.createShipmentButton')}
                      </Button>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </>
        )}
      </CardContent>

      {/* Add/Edit Package Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>
          {editingPackage ? t('orders.packages.dialogs.editTitle') : t('orders.packages.dialogs.addTitle')}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>{t('orders.packages.dialogs.packageTemplate')}</InputLabel>
            <Select
              value={formData.template || ''}
              label={t('orders.packages.dialogs.packageTemplate')}
              onChange={(e) => handleTemplateChange(e.target.value as number | '')}
              disabled={loadingTemplates}
            >
              <MenuItem value=''>{t('orders.packages.dialogs.customDimensions')}</MenuItem>
              {loadingTemplates ? (
                <MenuItem disabled>{t('orders.packages.dialogs.loadingTemplates')}</MenuItem>
              ) : (
                Array.isArray(templates) && templates.map(template => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name} ({template.length}×{template.width}×{template.height} cm)
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('orders.packages.dialogs.length')}
              type='number'
              size='small'
              value={formData.length}
              onChange={(e) => setFormData(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
              fullWidth
            />
            <TextField
              label={t('orders.packages.dialogs.width')}
              type='number'
              size='small'
              value={formData.width}
              onChange={(e) => setFormData(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
              fullWidth
            />
            <TextField
              label={t('orders.packages.dialogs.height')}
              type='number'
              size='small'
              value={formData.height}
              onChange={(e) => setFormData(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
              fullWidth
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('orders.packages.dialogs.weight')}
              type='number'
              size='small'
              value={formData.weight}
              onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
              required
              fullWidth
            />
            <TextField
              label={t('orders.packages.dialogs.quantity')}
              type='number'
              size='small'
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              inputProps={{ min: 1 }}
              fullWidth
            />
          </Box>

          <TextField
            label={t('orders.packages.dialogs.description')}
            size='small'
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            fullWidth
          />

          <TextField
            label={t('orders.packages.dialogs.notes')}
            size='small'
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            multiline
            rows={2}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>{t('common.actions.cancel')}</Button>
          <Button 
            onClick={handleSavePackage} 
            variant='contained'
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : (editingPackage ? t('common.actions.update') : t('common.actions.add'))}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Package Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>{t('orders.packages.dialogs.deletePackageTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('orders.packages.dialogs.deletePackageConfirm')}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>{t('common.actions.cancel')}</Button>
          <Button 
            onClick={handleDeletePackage} 
            color='error' 
            variant='contained'
            disabled={saving}
          >
            {t('common.actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Consignment Confirmation Dialog */}
      <Dialog open={deleteConsignmentConfirmOpen} onClose={() => setDeleteConsignmentConfirmOpen(false)}>
        <DialogTitle>{t('orders.packages.consignments.confirmDelete.title')}</DialogTitle>
        <DialogContent>
          <Typography>
            {t('orders.packages.consignments.confirmDelete.message', { consignmentNumber: deletingConsignment?.consignment_number || '' })}
          </Typography>
          {deletingConsignment?.state === 'shipped' || deletingConsignment?.state === 'delivered' ? (
            <Alert severity='warning' sx={{ mt: 2 }}>
              {t('orders.packages.consignments.confirmDelete.warnShippedOrDelivered')}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConsignmentConfirmOpen(false)}>{t('common.actions.cancel')}</Button>
          <Button 
            onClick={handleDeleteConsignment} 
            color='error' 
            variant='contained'
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : t('common.actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  )
}

export default PackagesCard
