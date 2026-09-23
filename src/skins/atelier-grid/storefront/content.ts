const asset = (file: string) => `/brand-assets/ultimate-space/${file.replace(/\.[^.]+$/, '')}-960.webp`

export const projects = [
  { title: 'Window treatment design and install', location: 'Parnell', category: 'Residential', image: asset('1781613809281-308960683.jpg'), path: '/projects/window-treatment-design-and-install' },
  { title: 'Office Partition Curtain', location: 'Parnell, Auckland · 2025', category: 'Commercial', image: asset('1781612552522-526533595.jpg'), path: '/projects/office-partition-curtain' },
  { title: 'Shutter design and installation', location: 'St Heliers', category: 'Residential', image: asset('1778655553091-483827087.jpg'), path: '/projects/shutter-design-and-installation' },
  { title: 'Healthcare privacy and cubicle tracks', location: 'Auckland & Waikato', category: 'Commercial', image: asset('1778655478215-53397689.jpg'), path: '/projects/healthcare-facility-suspended-privacy-and-cubical-track' },
  { title: 'Commercial office', location: 'Auckland Central', category: 'Commercial', image: asset('1778655387955-420239469.jpg'), path: '/projects/commercial-office' },
  { title: 'Trinity Changing Room', location: 'Albany, Auckland', category: 'Commercial', image: asset('1778655269664-274976731.jpg'), path: '/projects/trinity-changing-room' },
  { title: 'Te Whare Manaaki o Tama', location: 'Hamilton', category: 'Commercial', image: asset('1778655230000-26764100.jpg'), path: '/projects/te-whare-manaaki-o-tama' },
  { title: 'Karaka Pines Village', location: 'Drury, Auckland · 2025', category: 'Commercial', image: asset('1768718149477-769290315.jpg'), path: '/projects/karaka-pines-village' },
  { title: 'Metlifecare Fairway Gardens', location: 'Botany, Auckland · 2023', category: 'Commercial', image: asset('1768718354037-997267613.jpg'), path: '/projects/metlifecare-fairway-gardens' },
  { title: 'Intracare — Mercy Hospital', location: 'Epsom, Auckland · 2022', category: 'Commercial', image: asset('1768718835476-945932881.jpg'), path: '/projects/intracare-mercy-hospital' },
]

export const services = [
  { title: 'Automation', image: asset('1783650644367-239436183.jpg'), path: '/service/automation', description: 'Supply, installation and commissioning of motorised window systems. Actuators, controls and operating limits are carefully configured and tested for smooth, reliable performance.' },
  { title: 'Window treatment alteration and repair', image: asset('1781612752566-424968636.jpg'), path: '/service/window-treatment-alteration-and-repair', description: 'Corded and pulley track servicing, curtain and track rehanging, and made-to-measure alterations. Thoughtful repairs that extend the life of your window treatments.' },
  { title: 'Window treatment manufacture and repair', image: asset('1780559707983-886018302.jpg'), path: '/service/window-treatment-manufacture-and-repair', description: 'Custom blinds, curtains, shutters and awnings, from manufacture and installation to replacement and ongoing maintenance.' },
  { title: 'Interior Design', image: asset('1780559464473-598906088.webp'), path: '/service/interior-design', description: 'Personalised consultations, spatial planning, kitchen and bathroom design, custom joinery and considered selections of colour, materials, textiles and lighting.' },
]

export const products = [
  { title: 'Basswood shutters', image: asset('1781612252794-539494627.jpg'), path: '/parts/basswood-shutters', description: 'Considered light, privacy and proportion. Explore basswood, paulownia and aluminium shutter finishes.' },
  { title: 'Warwick fabric', image: asset('1778655134234-253467361.jpg'), path: '/parts/warwick-fabric', description: 'A textile collection for curtains, upholstery and individual interior schemes.' },
  { title: 'Recess fit ceiling track system', image: asset('1778655024332-844411590.jpg'), path: '/parts/recess-fit-ceiling-track-system', description: 'A discreet recessed curtain track for a clean ceiling detail.' },
  { title: 'Nettex Textile', image: asset('1768721881719-685755567.jpg'), path: '/parts/nettex-textile', description: 'Curtain textiles selected to complement your space and the way you live.' },
  { title: 'James Dunlop Textile', image: asset('1778655053995-800969898.png'), path: '/parts/james-dunlop-textile', description: 'Fabric, texture and colour for residential and commercial interiors.' },
  { title: 'Luxaflex single/double track system', image: asset('1778654886388-376991555.webp'), path: '/parts/luxaflex-singledouble-track-system', description: 'Single and double track options for tailored window treatments.' },
  { title: 'Ceiling fix wave track system', image: asset('1778654935724-414592833.webp'), path: '/parts/ceiling-fix-wave-track-system', description: 'Ceiling-mounted tracks for evenly spaced, flowing curtain folds.' },
]
