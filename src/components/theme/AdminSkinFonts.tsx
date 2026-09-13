/**
 * Web fonts named by the admin skins' `--at-font-*` tokens (`styles/admin-skins.css`):
 * Inter Tight for slate and carbon, IBM Plex Sans and Mono for compact. The tokens fall
 * back to system faces, so a layout that renders the admin design system without these
 * still works, just not in the skin's typeface.
 */
export default function AdminSkinFonts() {
  return (
    <>
      <link rel='preconnect' href='https://fonts.googleapis.com' />
      <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
      <link
        rel='stylesheet'
        href='https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
      />
    </>
  )
}
