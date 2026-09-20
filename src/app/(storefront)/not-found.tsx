'use client'

import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useTranslations } from 'next-intl'

/**
 * Rendered for every storefront `notFound()` — unknown CMS slugs, and now unknown
 * products and categories, which used to answer HTTP 200 with an empty page. Living
 * inside the (storefront) group means it keeps the site header and footer instead of
 * dropping the visitor on Next's bare built-in 404.
 */
export default function StorefrontNotFound() {
  const t = useTranslations('storefront')

  return (
    <Box sx={{ maxWidth: 640, mx: 'auto', px: 3, py: { xs: 8, md: 14 }, textAlign: 'center' }}>
      <Typography variant="h1" sx={{ fontSize: { xs: '4rem', md: '6rem' }, fontWeight: 700, lineHeight: 1 }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ mt: 2, fontWeight: 600 }}>
        {t('notFound.title')}
      </Typography>
      <Typography variant="body1" sx={{ mt: 1.5, color: 'text.secondary' }}>
        {t('notFound.description')}
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mt: 4 }}>
        <Button component={Link} href="/" variant="contained">
          {t('notFound.backToHome')}
        </Button>
        <Button component={Link} href="/search" variant="outlined">
          {t('notFound.browseProducts')}
        </Button>
      </Stack>
    </Box>
  )
}
