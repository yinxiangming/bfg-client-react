import type { ImgHTMLAttributes } from 'react'
import { brandImageStem, type BrandSite } from '@/utils/brandSites'

type Props = ImgHTMLAttributes<HTMLImageElement> & { brand: BrandSite['assetFolder']; src: string }

/** Responsive, self-hosted copies remain available after the original domains move. */
export default function BrandImage({ brand, src, alt, sizes = '(max-width: 760px) 100vw, 50vw', loading = 'lazy', ...props }: Props) {
  const stem = brandImageStem(src)
  const base = `/brand-assets/${brand}/${stem}`
  return <img {...props} alt={alt || ''} src={`${base}-960.webp`} srcSet={[480, 960, 1600].map(width => `${base}-${width}.webp ${width}w`).join(', ')} sizes={sizes} width={props.width || 1200} height={props.height || 900} loading={loading} decoding='async' />
}
