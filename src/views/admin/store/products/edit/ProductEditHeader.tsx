'use client'

// i18n Imports
import { useTranslations } from 'next-intl'

// MUI Imports
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography variant='h4'>{isNew ? t('products.edit.header.title.add') : t('products.edit.header.title.edit')}</Typography>
                <Typography variant='body2' color='text.secondary'>
                    {isNew ? t('products.edit.header.subtitle.add') : t('products.edit.header.subtitle.edit')}
                </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button variant='tonal' color='secondary' onClick={onDiscard} disabled={saving}>
                    {t('products.edit.actions.discard')}
                </Button>
                <Button variant='contained' onClick={onSave} disabled={saving}>
                    {saving
                        ? (isNew ? t('products.edit.actions.creating') : t('products.edit.actions.saving'))
                        : (isNew ? t('products.edit.actions.createProduct') : t('products.edit.actions.updateProduct'))}
                </Button>
            </Box>
        </Box>
    )
}

export default ProductEditHeader
