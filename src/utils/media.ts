/**
 * Utility functions for Django media URLs
 * Single source for NEXT_PUBLIC_MEDIA_URL to avoid repeated env references.
 */

export function getMediaBaseUrl(): string {
  return process.env.NEXT_PUBLIC_MEDIA_URL || '/media'
}

const STORE_IMAGES_PATH = 'seed_images/store'
const AVATAR_PATH = 'seed_images/avatars'

/** Default avatar URL (from seed_images, copied by seed_data --copy-images) */
export const DEFAULT_AVATAR_URL = `${getMediaBaseUrl()}/${AVATAR_PATH}/1.png`

/**
 * Normalize media URL - convert absolute URLs to use NEXT_PUBLIC_MEDIA_URL
 * @param url - URL (can be absolute or relative)
 * @returns Normalized media URL using NEXT_PUBLIC_MEDIA_URL
 */
export const normalizeMediaUrl = (url: string | null | undefined): string => {
  if (!url) return ''
  const base = getMediaBaseUrl()
  if (url.startsWith('http://') || url.startsWith('https://')) {
    const mediaMatch = url.match(/\/media\/(.+)$/)
    if (mediaMatch) {
      return `${base}/${mediaMatch[1]}`
    }
    return url
  }
  if (url.startsWith('/media/')) {
    const relativePath = url.replace('/media/', '')
    return `${base}/${relativePath}`
  }
  const cleanPath = url.startsWith('/') ? url.slice(1) : url
  return `${base}/${cleanPath}`
}

/**
 * Get Django media URL for store images
 * @param relativePath - Relative path from seed_images/store/
 * @returns Full media URL
 */
export const getStoreImageUrl = (relativePath: string): string => {
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  return `${getMediaBaseUrl()}/${STORE_IMAGES_PATH}/${cleanPath}`
}

/**
 * Get Django media URL for any media file
 * @param relativePath - Relative path from media root (or absolute URL)
 * @returns Full media URL using NEXT_PUBLIC_MEDIA_URL
 */
export const getMediaUrl = (relativePath: string | null | undefined): string => {
  if (!relativePath) return ''
  return normalizeMediaUrl(relativePath)
}

/**
 * Get avatar image URL
 * @param avatarPath - Avatar path (relative to seed_images/avatars/, or legacy images/avatars/, or full path)
 * @returns Full avatar URL using NEXT_PUBLIC_MEDIA_URL
 */
export const getAvatarUrl = (avatarPath?: string | null): string => {
  const base = getMediaBaseUrl()
  if (!avatarPath) {
    return DEFAULT_AVATAR_URL
  }
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath
  }
  if (avatarPath.includes('seed_images/avatars')) {
    const relativePath = avatarPath.replace(/^\/?seed_images\/avatars\/?/, '')
    return `${base}/${AVATAR_PATH}/${relativePath || '1.png'}`
  }
  if (avatarPath.startsWith('/images/avatars/') || avatarPath.startsWith('images/avatars/')) {
    const relativePath = avatarPath.replace(/^\/?images\/avatars\/?/, '')
    return `${base}/${AVATAR_PATH}/${relativePath || '1.png'}`
  }
  if (!avatarPath.includes('/')) {
    return `${base}/${AVATAR_PATH}/${avatarPath}`
  }
  const cleanPath = avatarPath.startsWith('/') ? avatarPath.slice(1) : avatarPath
  return `${base}/${cleanPath}`
}
