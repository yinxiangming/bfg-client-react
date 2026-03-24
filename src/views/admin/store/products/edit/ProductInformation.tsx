'use client'

// React Imports
import { useState, useEffect } from 'react'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import CustomTextField from '@/components/ui/TextField'
import ProductScannerDialog from '@/components/products/ProductScannerDialog'

// Type Imports
import type { Product } from '@/services/store'
import { uploadProductMedia } from '@/services/store'
import type { ProductDetails } from '@/services/productScanner'
import { getWorkspaceSettings } from '@/services/settings'
import { apiFetch, buildApiUrl, API_VERSIONS } from '@/utils/api'
import { isBase64ImageUrl, dataUrlToFile, urlToFileViaProxy } from '@/utils/scannedImage'

export type ProductInformationProps = {
    productData?: Partial<Product>
    onChange?: (field: keyof Product, value: any) => void
    /** When set (edit page), base64 images will be uploaded and linked to this product. */
    productId?: string
    /** Called after a base64 image was uploaded so parent can refresh product media. */
    onScannedImageAdded?: () => void | Promise<void>
    /** When set (edit page), after import we ask user if they want to save; if yes this is called. */
    onSave?: () => Promise<void>
    /** Optional override for label printing behavior (e.g. extension-specific label endpoint). */
    onPrintLabel?: (productId: number, printTab: Window) => Promise<void>
}

const CONDITION_VALUES = ['new', 'like_new', 'good', 'fair', 'poor'] as const
const LABEL_BLOB_URL_REVOKE_MS = 120_000

const ProductInformation = ({
    productData,
    onChange,
    productId,
    onScannedImageAdded,
    onSave,
    onPrintLabel,
}: ProductInformationProps) => {
    const t = useTranslations('admin')
    const [name, setName] = useState(productData?.name || '')
    const [slug, setSlug] = useState(productData?.slug || '')
    const [sku, setSku] = useState(productData?.sku || '')
    const [barcode, setBarcode] = useState((productData as any)?.barcode || '')
    const [condition, setCondition] = useState((productData as any)?.condition || '')
    const [scannerDialogOpen, setScannerDialogOpen] = useState(false)
    const [scannerEnabled, setScannerEnabled] = useState(false)
    const [scannerConfig, setScannerConfig] = useState({ apiUrl: '', apiKey: '' })
    const [autoSaveDialogOpen, setAutoSaveDialogOpen] = useState(false)
    const [printingLabel, setPrintingLabel] = useState(false)

    const openLabelPrintTab = (): Window | null => window.open('about:blank', '_blank')

    const assignPdfBlobToPrintTab = (win: Window, blob: Blob): void => {
        const url = URL.createObjectURL(blob)
        win.location.assign(url)
        window.setTimeout(() => URL.revokeObjectURL(url), LABEL_BLOB_URL_REVOKE_MS)
    }

    const handlePrintProductLabel = async () => {
        if (!productId || productId === 'new') return
        const productNumericId = Number(productId)
        if (!Number.isFinite(productNumericId) || productNumericId <= 0) return

        const printTab = openLabelPrintTab()
        if (!printTab) {
            alert(t('products.information.labelActions.popupBlocked'))
            return
        }

        setPrintingLabel(true)
        try {
            if (onPrintLabel) {
                await onPrintLabel(productNumericId, printTab)
            } else {
                const labelUrl = buildApiUrl(`/products/${productNumericId}/label/`, API_VERSIONS.BFG2)
                const raw = await apiFetch<unknown>(labelUrl, {
                    method: 'GET',
                    headers: { Accept: 'application/pdf' }
                })
                const response = raw as Response
                const blob = await response.blob()
                assignPdfBlobToPrintTab(printTab, blob)
            }
        } catch (err) {
            printTab.close()
            alert(err instanceof Error ? err.message : t('products.information.labelActions.printFailed'))
        } finally {
            setPrintingLabel(false)
        }
    }

    // Load Product Scanner settings
    useEffect(() => {
        const loadScannerSettings = async () => {
            try {
                const settings = await getWorkspaceSettings()
                const plugins = (settings.custom_settings as any)?.plugins || {}
                const scannerSettings = plugins.product_scanner || {}

                setScannerEnabled(scannerSettings.enabled === true)
                if (scannerSettings.enabled) {
                    setScannerConfig({
                        apiUrl: scannerSettings.api_url ?? '',
                        apiKey: scannerSettings.api_key ?? ''
                    })
                }
            } catch (err) {
                console.error('Failed to load Product Scanner settings:', err)
            }
        }
        loadScannerSettings()
    }, [])

    // Sync with productData changes
    useEffect(() => {
        setName(productData?.name || '')
        setSlug(productData?.slug || '')
        setSku(productData?.sku || '')
        setBarcode((productData as any)?.barcode || '')
        setCondition((productData as any)?.condition || '')
    }, [productData?.name, productData?.slug, productData?.sku, (productData as any)?.barcode, (productData as any)?.condition])

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setName(e.target.value)
        onChange?.('name', e.target.value)
    }

    const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSlug(e.target.value)
        onChange?.('slug', e.target.value)
    }

    const handleSkuChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSku(e.target.value)
        onChange?.('sku', e.target.value)
    }

    const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setBarcode(e.target.value)
        // @ts-ignore - barcode might not be in Product type but we send it anyway
        onChange?.('barcode' as keyof Product, e.target.value)
    }

    const handleConditionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setCondition(value)
        onChange?.('condition' as keyof Product, value)
    }

    const handleScannerSelect = async (product: ProductDetails, selectedImageUrls: string[]) => {
        // Auto-fill product information from scanned data
        if (product.name) {
            setName(product.name)
            onChange?.('name', product.name)
        }
        if (product.brand) {
            onChange?.('brand' as keyof Product, product.brand)
        }
        if (product.model) {
            setSku(product.model)
            onChange?.('sku', product.model)
        }
        if (product.description) {
            onChange?.('description', product.description)
        }
        // Upload each selected image when we have productId; refresh media list after each so UI updates
        const urlsToUpload = selectedImageUrls.length > 0 ? selectedImageUrls : (product.image_url ? [product.image_url] : [])
        if (productId && productId !== 'new' && urlsToUpload.length > 0) {
            try {
                for (let i = 0; i < urlsToUpload.length; i++) {
                    const imageUrl = urlsToUpload[i]
                    const file = isBase64ImageUrl(imageUrl)
                        ? dataUrlToFile(imageUrl, `scanned-${i}.png`)
                        : await urlToFileViaProxy(imageUrl, `scanned-${i}.png`)
                    await uploadProductMedia(parseInt(productId, 10), file)
                    await onScannedImageAdded?.()
                }
                onChange?.('scanned_image_url' as keyof Product, urlsToUpload[0])
            } catch (err) {
                console.error('Failed to upload scanned image(s)', err)
                onChange?.('scanned_image_url' as keyof Product, urlsToUpload[0])
            }
        } else if (urlsToUpload.length > 0) {
            onChange?.('scanned_image_url' as keyof Product, urlsToUpload[0])
        }
        if (onSave) {
            setAutoSaveDialogOpen(true)
        }
    }

    return (
        <>
        <Card>
            <CardHeader
                title={t('products.information.title')}
                sx={{ pb: 0 }}
                action={
                    scannerEnabled ? (
                        <Button
                            variant='outlined'
                            size='small'
                            startIcon={<i className='tabler-scan' />}
                            onClick={() => setScannerDialogOpen(true)}
                        >
                            {t('products.scanner.button')}
                        </Button>
                    ) : null
                }
            />
            <CardContent sx={{ pt: 2, '&:last-child': { pb: 2 } }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <CustomTextField
                            fullWidth
                            size="small"
                            label={t('products.information.fields.name.label')}
                            placeholder={t('products.information.fields.name.placeholder')}
                            value={name}
                            onChange={handleNameChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <CustomTextField
                            fullWidth
                            size="small"
                            label={t('products.information.fields.slug.label')}
                            placeholder={t('products.information.fields.slug.placeholder')}
                            value={slug}
                            onChange={handleSlugChange}
                            helperText={t('products.information.fields.slug.helper')}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomTextField
                            fullWidth
                            size="small"
                            label={t('products.information.fields.sku.label')}
                            placeholder={t('products.information.fields.sku.placeholder')}
                            value={sku}
                            onChange={handleSkuChange}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomTextField
                            fullWidth
                            size="small"
                            label={t('products.information.fields.barcode.label')}
                            placeholder={t('products.information.fields.barcode.placeholder')}
                            value={barcode}
                            onChange={handleBarcodeChange}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position='end'>
                                        <Tooltip title={t('products.information.labelActions.print')}>
                                            <span>
                                                <IconButton
                                                    size='small'
                                                    onClick={() => void handlePrintProductLabel()}
                                                    disabled={!productId || productId === 'new' || printingLabel}
                                                >
                                                    {printingLabel ? <CircularProgress size={16} /> : <i className='tabler-printer' />}
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <CustomTextField
                            fullWidth
                            size="small"
                            select
                            label={t('products.information.fields.condition.label')}
                            value={condition}
                            onChange={handleConditionChange}
                            SelectProps={{ displayEmpty: true, renderValue: v => v ? t(`products.information.fields.condition.options.${v}` as any) : '' }}
                        >
                            <MenuItem value="">{t('products.information.fields.condition.placeholder')}</MenuItem>
                            {CONDITION_VALUES.map(c => (
                                <MenuItem key={c} value={c}>{t(`products.information.fields.condition.options.${c}` as any)}</MenuItem>
                            ))}
                        </CustomTextField>
                    </Grid>
                </Grid>
            </CardContent>
        </Card>

        {scannerEnabled && (
            <ProductScannerDialog
                open={scannerDialogOpen}
                onClose={() => setScannerDialogOpen(false)}
                onSelect={handleScannerSelect}
                config={scannerConfig}
            />
        )}

        <Dialog open={autoSaveDialogOpen} onClose={() => setAutoSaveDialogOpen(false)}>
            <DialogTitle>{t('products.scanner.autoSave.title')}</DialogTitle>
            <DialogContent>
                <DialogContentText>{t('products.scanner.autoSave.message')}</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setAutoSaveDialogOpen(false)}>{t('products.scanner.autoSave.no')}</Button>
                <Button
                    variant='contained'
                    onClick={async () => {
                        setAutoSaveDialogOpen(false)
                        await onSave?.()
                    }}
                >
                    {t('products.scanner.autoSave.yes')}
                </Button>
            </DialogActions>
        </Dialog>
        </>
    )
}

export default ProductInformation
