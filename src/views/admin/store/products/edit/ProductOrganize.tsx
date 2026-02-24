'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'

// i18n Imports
import { useLocale, useTranslations } from 'next-intl'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import MenuItem from '@mui/material/MenuItem'
import Switch from '@mui/material/Switch'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Autocomplete from '@mui/material/Autocomplete'

// Component Imports
import CustomTextField from '@/components/ui/TextField'
import CategoryTreeSelect from '@/components/category/CategoryTreeSelect'

// Type Imports
import type { Product } from '@/services/store'
import { getCategoriesTree, getTags, type Category, type Tag } from '@/services/store'

type ProductOrganizeProps = {
    productData?: Partial<Product>
    onChange?: (field: keyof Product, value: any) => void
}

const ProductOrganize = ({ productData, onChange }: ProductOrganizeProps) => {
    const locale = useLocale()
    const t = useTranslations('admin')
    const [isActive, setIsActive] = useState(productData?.is_active ?? true)
    const [isFeatured, setIsFeatured] = useState(productData?.is_featured ?? false)
    const [productType, setProductType] = useState(productData?.product_type || 'physical')
    const [categories, setCategories] = useState<Category[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
    const [selectedTags, setSelectedTags] = useState<(Tag | string)[]>([])
    const [loading, setLoading] = useState(false)
    const [categoriesLoaded, setCategoriesLoaded] = useState(false)
    const [tagsLoaded, setTagsLoaded] = useState(false)

    useEffect(() => {
        setIsActive(productData?.is_active ?? true)
        setIsFeatured(productData?.is_featured ?? false)
        setProductType(productData?.product_type || 'physical')
        
        // Set selected categories and tags from productData
        if (productData?.categories && Array.isArray(productData.categories)) {
            setSelectedCategories(productData.categories as any)
        }
        if (productData?.tags && Array.isArray(productData.tags)) {
            // Tags from backend are objects with id and name
            setSelectedTags(productData.tags as any)
        }
    }, [productData?.is_active, productData?.is_featured, productData?.product_type, productData?.categories, productData?.tags])

    // Load categories only when user opens the category dropdown
    const loadCategories = useCallback(async () => {
        if (categoriesLoaded) return
        try {
            setLoading(true)
            const data = await getCategoriesTree(locale).catch(err => {
                console.error('Failed to load categories:', err)
                return []
            })
            setCategories(Array.isArray(data) ? data : [])
        } finally {
            setCategoriesLoaded(true)
            setLoading(false)
        }
    }, [locale, categoriesLoaded])

    // Load tags only when user opens the tags dropdown
    const loadTags = useCallback(async () => {
        if (tagsLoaded) return
        try {
            setLoading(true)
            const data = await getTags(locale).catch(err => {
                console.error('Failed to load tags:', err)
                return []
            })
            setTags(Array.isArray(data) ? data : [])
        } finally {
            setTagsLoaded(true)
            setLoading(false)
        }
    }, [locale, tagsLoaded])

    const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsActive(e.target.checked)
        onChange?.('is_active', e.target.checked)
    }

    const handleFeaturedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsFeatured(e.target.checked)
        onChange?.('is_featured', e.target.checked)
    }

    const handleProductTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProductType(e.target.value)
        onChange?.('product_type', e.target.value)
    }

    const handleCategoriesChange = (newValue: Category[]) => {
        const categories = Array.isArray(newValue) ? newValue : []
        setSelectedCategories(categories)
        // Send category IDs to backend
        onChange?.('category_ids' as any, categories.map(c => c.id))
    }

    const handleTagsChange = (_: any, newValue: (Tag | string)[]) => {
        setSelectedTags(newValue)
        // Separate existing tags (with IDs) and new tag names (strings)
        const tagIds: number[] = []
        const tagNames: string[] = []
        
        newValue.forEach(item => {
            if (typeof item === 'string') {
                // New tag name entered by user
                tagNames.push(item.trim())
            } else if (item && item.id) {
                // Existing tag object
                tagIds.push(item.id)
            }
        })
        
        // Send both tag IDs and tag names to backend
        if (tagIds.length > 0) {
            onChange?.('tag_ids' as any, tagIds)
        }
        if (tagNames.length > 0) {
            onChange?.('tag_names' as any, tagNames)
        }
        // If both are present, we'll need to handle it in the save logic
        if (tagIds.length > 0 || tagNames.length > 0) {
            onChange?.('tag_data' as any, { tag_ids: tagIds, tag_names: tagNames })
        }
    }

    return (
        <Card>
            <CardHeader title={t('products.organize.title')} />
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0, '& > *': { mb: 3 } }}>
                <CustomTextField
                    select
                    fullWidth
                    label={t('products.organize.fields.productType.label')}
                    value={productType}
                    onChange={handleProductTypeChange}
                >
                    <MenuItem value='physical'>{t('products.organize.fields.productType.options.physical')}</MenuItem>
                    <MenuItem value='digital'>{t('products.organize.fields.productType.options.digital')}</MenuItem>
                    <MenuItem value='service'>{t('products.organize.fields.productType.options.service')}</MenuItem>
                </CustomTextField>

                {categoriesLoaded && categories.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography color='text.secondary'>{t('products.organize.states.noCategories')}</Typography>
                    </Box>
                ) : (
                    <CategoryTreeSelect
                        categories={categories}
                        value={selectedCategories}
                        onChange={handleCategoriesChange}
                        onOpen={loadCategories}
                        loading={loading}
                        label={t('products.organize.fields.categories.label')}
                        placeholder={t('products.organize.fields.categories.placeholder')}
                    />
                )}

                <Autocomplete
                    multiple
                    freeSolo
                    options={tags}
                    getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                    value={selectedTags}
                    onChange={handleTagsChange}
                    onOpen={loadTags}
                    loading={loading}
                    renderInput={(params) => (
                        <CustomTextField
                            {...params}
                            label={t('products.organize.fields.tags.label')}
                            placeholder={t('products.organize.fields.tags.placeholder')}
                            InputLabelProps={{
                                ...params.InputLabelProps,
                                shrink: true,
                            }}
                        />
                    )}
                    renderTags={(value, getTagProps) =>
                        value.map((option, index) => {
                            const label = typeof option === 'string' ? option : option.name
                            const key = typeof option === 'string' ? `new-${index}-${label}` : option.id
                            return (
                                <Chip
                                    label={label}
                                    {...getTagProps({ index })}
                                    key={key}
                                />
                            )
                        })
                    }
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography>{t('products.organize.fields.published')}</Typography>
                        <Switch
                            checked={isActive}
                            onChange={handleActiveChange}
                        />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography>{t('products.organize.fields.featured')}</Typography>
                        <Switch
                            checked={isFeatured}
                            onChange={handleFeaturedChange}
                        />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    )
}

export default ProductOrganize
