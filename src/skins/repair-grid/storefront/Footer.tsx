'use client'

import Link from 'next/link'

export default function RepairGridFooter() {
  return (
    <footer className='repair-grid-footer'>
      <div className='repair-grid-footer-compact'>
        <Link href='/' className='repair-grid-footer-brand'>THE REPAIR HUB</Link>
        <span>© 2015 The Repair Hub</span>
        <Link href='/auth/login'>Staff login</Link>
      </div>
    </footer>
  )
}
