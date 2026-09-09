'use client'

import Box from '@mui/material/Box'

/**
 * Layout only. `/admin/m/*` renders inside `app/admin/layout.tsx`, which already wraps
 * everything in <StaffMemberProvider><AdminAccessGuard>: no token redirects to the login
 * page, a signed-in non-staff user goes to /account, and children render only for an
 * active staff member.
 *
 * This file used to repeat that check against Django's `user.is_staff`, which is not what
 * gates the admin — membership is a StaffMember row for the workspace, and a shop's own
 * operators are staff of their workspace without being Django staff. So an admin who
 * could use every desktop page was bounced from the mobile ones to /admin/dashboard,
 * and the fix was to hand out a Django-wide flag to make a per-workspace screen open.
 */
export default function MobileAdminLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <Box component='main' sx={{ minHeight: '100vh', bgcolor: 'background.default', p: 2 }}>
      {children}
    </Box>
  )
}
