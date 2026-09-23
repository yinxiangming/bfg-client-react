'use client'
import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import BrandImage from '@/components/storefront/BrandImage'
type Props={pageData:{title?:string;slug?:string};slug?:string}
type Card = { title: string; copy: string; image: string; path: string; price?: string }
const projects: Card[]=[
  {title:'Wheelchair general service',copy:'Auckland, NZ • 2026',image:'1776850444971-730008485.webp',path:'/projects/wheel-chair-general-service'},
  {title:'Mobility scooter service and repair',copy:'Auckland, NZ • 2026',image:'1776850658369-648600445.webp',path:'/projects/mobility-scooter-service-and-repair'},
  {title:'Powerchair service and repair',copy:'Auckland, NZ • 2026',image:'1776851070926-759348583.jpg',path:'/projects/powerchair-service-and-repair'},
]
const services: Card[]=[
  {title:'Puncture repair',copy:'Professional puncture repair service. Comprehensive tube stock range',image:'1776852175355-770108221.webp',path:'/service/puncture-repair'},
  {title:'Battery replacement',copy:'Battery health check and charging service. Battery end of life replacement',image:'1776852321276-827513091.jpg',path:'/service/battery-replacement'},
  {title:'Wheelchair general service',copy:'Puncture, arm rest adjustment, foot rest adjustment, castor, bearing and brake line service',image:'1776852391560-891943404.webp',path:'/service/wheelchair-service'},
  {title:'Call-out Service',copy:'Our friendly team comes to you with the tools needed to diagnose and repair onsite.',image:'1776853069704-632882352.jpg',path:'/service/call-out-service'},
]
const products: Card[]=[
  {title:'Call-out Service',price:'$99.00',copy:'Onsite repair for all mobility scooters',image:'1776857652978-640993667.jpg',path:'/parts/call-out-service-product'},
  {title:'12V 75Ah Deepcycle Battery',price:'$365.00',copy:'12v 75Ah deepcycle battery',image:'1776857580046-753725979.webp',path:'/parts/12v-75ah-deepcycle-battery'},
  {title:'4.1/3.5-4',price:'$35.00',copy:'High-quality replacement tyres for Invacare scooter.',image:'1776853892259-326110687.webp',path:'/parts/4135-4'},
]
export default function CmsPage({ pageData, slug }: Props) {
  const current = slug || pageData.slug || ''
  const [emailReady, setEmailReady] = useState(false)
  const openEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const body = `Name: ${fields.get('name')}\nEmail: ${fields.get('email')}\nPhone: ${fields.get('phone')}\n\n${fields.get('message')}`
    window.location.href = `mailto:info@dygroup.co.nz?subject=${encodeURIComponent('Repair and service enquiry')}&body=${encodeURIComponent(body)}`
    setEmailReady(true)
  }
  if (current === 'contact') return <section className='repair-grid-cms repair-grid-contact'>
    <h1>Contact us</h1><p>Tell us what needs fixing. We're here to help.</p>
    <div className='repair-grid-contact-grid'>
      <form onSubmit={openEmail}>
        <label>Name<input name='name' autoComplete='name' /></label>
        <label>Email *<input name='email' type='email' autoComplete='email' required /></label>
        <label>Phone<input name='phone' type='tel' autoComplete='tel' /></label>
        <label>How can we help? *<textarea name='message' required /></label>
        <button type='submit'>Continue in your email app ↗</button>
        <p style={{ fontSize: 13, color: '#73767b', lineHeight: 1.6 }} role='status'>{emailReady ? 'Your email app has been requested. Send the draft there, or contact us directly using the details alongside.' : 'Opens an email draft for you to review and send.'}</p>
      </form>
      <div><h2>Let's get you moving.</h2><p>Speak with our team about servicing, repairs, replacement parts or a call-out.</p><address>7/28 Harrison Road<br />Mt Wellington, Auckland 1060</address><a href='tel:0800866366'>0800 866 366</a><a href='mailto:info@dygroup.co.nz'>info@dygroup.co.nz ↗</a></div>
    </div>
  </section>
  if (current === 'about') return <section className='repair-grid-cms'>
    <h1>About The Repair Hub</h1><p>Local expertise. Personal service. Everyday independence.</p>
    <div className='repair-grid-about'><BrandImage brand='repair-hub' src={services[3].image} alt='Onsite mobility service and repair' width={800} height={600} sizes='(max-width: 780px) 100vw, 50vw' /><div><h2>Keeping you moving,<br />with confidence.</h2><p>We service and repair mobility scooters, wheelchairs and powerchairs. From a puncture or battery replacement to a general service, our Auckland team is here to help.</p><p>Visit us in Mt Wellington or ask about our call-out service.</p><Link href='/contact'>Talk to our team ↗</Link></div></div>
  </section>
  const rows = current === 'projects' ? projects : current === 'services' ? services : products
  const intro = current === 'projects' ? 'Explore our latest service and repair work.' : current === 'services' ? 'Our professional and friendly team is here to help.' : 'Parts and practical support for your everyday mobility.'
  return <section className='repair-grid-cms'>
    <h1>{pageData.title || current}</h1><p>{intro}</p>
    <div className='repair-grid-cms-grid'>{rows.map((row, index) => <article key={row.path}>
      <Link href={row.path} aria-label={row.title}><BrandImage brand='repair-hub' src={row.image} alt={row.title} width={800} height={600} sizes='(max-width: 780px) 100vw, 33vw' loading={index < 3 ? 'eager' : 'lazy'} /></Link>
      <div><h2><Link href={row.path}>{row.title}</Link></h2><p>{row.price ? `${row.price} · ${row.copy}` : row.copy}</p><Link href={row.path}>View details ↗</Link></div>
    </article>)}</div>
  </section>
}
