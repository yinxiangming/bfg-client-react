'use client'

type Props = {
  children: React.ReactNode
}

const BlankLayout = ({ children }: Props) => {
  return (
    <div className='is-full bs-full' data-skin='default'>
      {children}
    </div>
  )
}

export default BlankLayout

