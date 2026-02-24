/**
 * Utility functions for Django media URLs
 */

const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_MEDIA_URL || '/media'
const STORE_IMAGES_PATH = 'seed_images/store'
const AVATAR_PATH = 'seed_images/avatars'

/** Default avatar URL (from seed_images, copied by seed_data --copy-images) */
export const DEFAULT_AVATAR_URL = `${MEDIA_BASE_URL}/${AVATAR_PATH}/1.png`

/**
 * Normalize media URL - convert absolute URLs to use NEXT_PUBLIC_MEDIA_URL
 * @param url - URL (can be absolute or relative)
 * @returns Normalized media URL using NEXT_PUBLIC_MEDIA_URL
 */
export const normalizeMediaUrl = (url: string | null | undefined): string => {
  if (!url) return ''
  
  // If it's already a full URL (http:// or https://), extract the media path
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Extract path after /media/
    const mediaMatch = url.match(/\/media\/(.+)$/)
    if (mediaMatch) {
      return `${MEDIA_BASE_URL}/${mediaMatch[1]}`
    }
    // If no /media/ found, return as is (external URL)
    return url
  }
  
  // If it's already a relative path starting with /media/, use it directly
  if (url.startsWith('/media/')) {
    const relativePath = url.replace('/media/', '')
    return `${MEDIA_BASE_URL}/${relativePath}`
  }
  
  // If it's a relative path without /media/, add it
  const cleanPath = url.startsWith('/') ? url.slice(1) : url
  return `${MEDIA_BASE_URL}/${cleanPath}`
}

/**
 * Get Django media URL for store images
 * @param relativePath - Relative path from seed_images/store/
 * @returns Full media URL
 */
export const getStoreImageUrl = (relativePath: string): string => {
  // Remove leading slash if present
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath
  return `${MEDIA_BASE_URL}/${STORE_IMAGES_PATH}/${cleanPath}`
}

/**
 * Get Django media URL for any media file
 * @param relativePath - Relative path from media root (or absolute URL)
 * @returns Full media URL using NEXT_PUBLIC_MEDIA_URL
 */
export const getMediaUrl = (relativePath: string | null | undefined): string => {
  if (!relativePath) return ''
  
  // Use normalizeMediaUrl to handle both absolute and relative paths
  return normalizeMediaUrl(relativePath)
}

/**
 * Get avatar image URL
 * @param avatarPath - Avatar path (relative to seed_images/avatars/, or legacy images/avatars/, or full path)
 * @returns Full avatar URL using NEXT_PUBLIC_MEDIA_URL
 */
export const getAvatarUrl = (avatarPath?: string | null): string => {
  if (!avatarPath) {
    return DEFAULT_AVATAR_URL
  }
  
  // If it's already a full URL, return as is
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath
  }
  
  // seed_images/avatars/ or /seed_images/avatars/
  if (avatarPath.includes('seed_images/avatars')) {
    const relativePath = avatarPath.replace(/^\/?seed_images\/avatars\/?/, '')
    return `${MEDIA_BASE_URL}/${AVATAR_PATH}/${relativePath || '1.png'}`
  }
  
  // Legacy: /images/avatars/
  if (avatarPath.startsWith('/images/avatars/') || avatarPath.startsWith('images/avatars/')) {
    const relativePath = avatarPath.replace(/^\/?images\/avatars\/?/, '')
    return `${MEDIA_BASE_URL}/${AVATAR_PATH}/${relativePath || '1.png'}`
  }
  
  // If it's just a filename like "1.png", assume seed_images/avatars/
  if (!avatarPath.includes('/')) {
    return `${MEDIA_BASE_URL}/${AVATAR_PATH}/${avatarPath}`
  }
  
  // Otherwise, treat as relative path from media root
  const cleanPath = avatarPath.startsWith('/') ? avatarPath.slice(1) : avatarPath
  return `${MEDIA_BASE_URL}/${cleanPath}`
}

