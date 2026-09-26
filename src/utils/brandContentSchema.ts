type ContentSchemaInput = {
  brandSlug: string
  section: 'projects' | 'service' | 'parts'
  slug: string
  url: string
  organizationId: string
  name: string
  description?: string
  image?: string
  dateModified?: string
}

/** Describe the real entity without inventing prices, stock, ratings or manufacturers. */
export function buildBrandContentSchema(input: ContentSchemaInput) {
  const isService = input.section === 'service' || (
    input.brandSlug === 'repair-hub' && input.section === 'parts' && input.slug === 'call-out-service-product'
  )
  const type = isService ? 'Service' : input.section === 'parts' ? 'Product' : 'CreativeWork'
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${input.url}#content`,
    url: input.url,
    name: input.name,
    description: input.description,
    image: input.image,
    ...(type === 'Service' ? { provider: { '@id': input.organizationId } } : {}),
    ...(type === 'CreativeWork' ? { creator: { '@id': input.organizationId }, dateModified: input.dateModified } : {}),
  }
}
