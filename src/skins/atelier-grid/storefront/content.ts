/** CMS page rendering owns all project, service and product content. */
export type AtelierContentPost = {
  title?: string
  slug?: string
  excerpt?: string
  featured_image?: string
  custom_fields?: Record<string, unknown>
}
