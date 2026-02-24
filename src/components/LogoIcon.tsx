// React Imports
import type { SVGAttributes } from 'react'

/** Letter B: blue vertical stem on the left, two white semicircles (bowls) on the right */
const BFG_BLUE = '#2563eb'
const BFG_WHITE = '#ffffff'

const LogoIcon = (props: SVGAttributes<SVGElement>) => {
  return (
    <svg width='1.4583em' height='1em' viewBox='0 0 35 24' fill='none' xmlns='http://www.w3.org/2000/svg' {...props}>
      {/* Left: vertical stem of B */}
      <path fillRule='evenodd' clipRule='evenodd' d='M0 0h12v24H0V0z' fill={BFG_BLUE} />
      {/* Right: top semicircle (upper bowl) */}
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M12 0a6 6 0 0 1 0 12H12V0z'
        fill={BFG_WHITE}
      />
      {/* Right: bottom semicircle (lower bowl) */}
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M12 12a6 6 0 0 1 0 12H12V12z'
        fill={BFG_WHITE}
      />
    </svg>
  )
}

export default LogoIcon
