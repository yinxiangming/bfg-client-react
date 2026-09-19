'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Button from '@mui/material/Button'

// Component Imports
import AdminPageHeader from '@/components/admin/AdminPageHeader'

type ProductEditHeaderProps = {
    productId: string
    onSave: () => void
    onDiscard: () => void
    saving?: boolean
}

const ProductEditHeader = ({ productId, onSave, onDiscard, saving }: ProductEditHeaderProps) => {
    const t = useTranslations('admin')
    const isNew = productId === 'new'
    
    return (
        <AdminPageHeader
            title={isNew ? t('products.edit.header.title.add') : t('products.edit.header.title.edit')}
            subtitle={isNew ? t('products.edit.header.subtitle.add') : t('products.edit.header.subtitle.edit')}
            actions={
                <>
                    <Button variant='tonal' color='secondary' onClick={onDiscard} disabled={saving}>
                        {t('products.edit.actions.discard')}
                    </Button>
                    <Button variant='contained' onClick={onSave} disabled={saving}>
                        {saving
                            ? (isNew ? t('products.edit.actions.creating') : t('products.edit.actions.saving'))
                            : (isNew ? t('products.edit.actions.createProduct') : t('products.edit.actions.updateProduct'))}
                    </Button>
                </>
            }
        />
    )
}

export default ProductEditHeader
