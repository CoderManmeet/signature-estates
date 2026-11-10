import Link from 'next/link'
import { ArrowUpRight, Filter, Map, SlidersHorizontal } from 'lucide-react'
import { Header, PropertyCard } from '@/components/site'
import { getLocalities, getProperties, type ListingQuery } from '@/lib/api'

export const revalidate = 300

type SearchParams = Promise<Record<string, string | string[] | undefined>>

const PAGE_SIZE = 12

const SORTS = [
  { value: 'newest', label: 'newest' },
  { value: 'price_asc', label: 'price ↑' },
  { value: 'price_desc', label: 'price ↓' },
  { value: 'area_desc', label: 'largest' },
] as const

/** Query keys the page understands; anything else in the URL is ignored. */
const FILTER_KEYS = ['locality', 'city', 'propertyType', 'listingType', 'minPrice', 'maxPrice', 'bedrooms', 'furnishing', 'possessionStatus', 'amenities'] as const

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const num = (v: string | undefined) => (v && /^\d+$/.test(v) ? Number(v) : undefined)

const chipOn = 'whitespace-nowrap rounded-full bg-[#1c2421] px-4 py-2 text-[10px] uppercase tracking-widest text-white'
const chipOff = 'whitespace-nowrap rounded-full border border-[#d8d5cd] px-4 py-2 text-[10px] uppercase tracking-widest text-[#66716b]'

export default async function Listings({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const current: Record<string, string> = {}
  for (const k of [...FILTER_KEYS, 'sort', 'page'] as const) {
    const v = one(sp[k])
    if (v) current[k] = v
  }

  const sort = (SORTS.find((s) => s.value === current.sort)?.value ?? 'newest') as NonNullable<ListingQuery['sort']>
  const page = Math.max(1, num(current.page) ?? 1)

  const [{ properties, pagination }, { cities }] = await Promise.all([
    getProperties({
      page,
      limit: PAGE_SIZE,
      sort,
      locality: current.locality,
      city: current.city,
      propertyType: current.propertyType,
      listingType: current.listingType,
      minPrice: num(current.minPrice),
      maxPrice: num(current.maxPrice),
      bedrooms: num(current.bedrooms),
      furnishing: current.furnishing,
      possessionStatus: current.possessionStatus,
      amenities: current.amenities,
    }),
    getLocalities(),
  ])

  /** Build a /listings URL from the current params with overrides (undefined removes a key). */
  const href = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams()
    for (const [k, v] of Object.entries({ ...current, page: undefined, ...overrides })) if (v) next.set(k, v)
    const qs = next.toString()
    return qs ? `/listings?${qs}` : '/listings'
  }

  const topCities = cities.slice(0, 3).map((c) => c.city)
  const chips = [
    ...topCities.map((city) => ({ label: city, active: current.city === city, to: href({ city: current.city === city ? undefined : city }) })),
    { label: 'Ready to move', active: current.possessionStatus === 'READY_TO_MOVE', to: href({ possessionStatus: current.possessionStatus === 'READY_TO_MOVE' ? undefined : 'READY_TO_MOVE' }) },
    { label: 'Villas', active: current.propertyType === 'VILLA', to: href({ propertyType: current.propertyType === 'VILLA' ? undefined : 'VILLA' }) },
  ]
  const anyFilter = FILTER_KEYS.some((k) => current[k])

  const sortIndex = SORTS.findIndex((s) => s.value === sort)
  const nextSort = SORTS[(sortIndex + 1) % SORTS.length].value
  const curatedAcross = cities.map((c) => c.city)
  const curatedLine = curatedAcross.length > 1 ? `${curatedAcross.slice(0, -1).join(', ')} & ${curatedAcross[curatedAcross.length - 1]}` : curatedAcross[0]

  return <><Header/><main className="pt-20"><section className="bg-[#1c2421] px-5 py-20 text-white lg:px-10"><div className="mx-auto max-w-7xl"><p className="mb-4 text-[10px] uppercase tracking-[.3em] text-[#cbb892]">The collection</p><h1 className="display-title text-7xl leading-none md:text-9xl">Find your<br/><i>next chapter.</i></h1></div></section><section className="mx-auto max-w-7xl px-5 py-12 lg:px-10"><div className="mb-10 flex flex-col justify-between gap-5 border-b border-[#d8d5cd] pb-6 md:flex-row md:items-center"><div><p className="font-serif text-3xl">{pagination.total} {pagination.total === 1 ? 'home' : 'homes'} worth seeing</p>{curatedLine&&<p className="mt-1 text-xs text-[#66716b]">Curated across {curatedLine}</p>}</div><div className="flex gap-3"><button className="flex items-center gap-2 border border-[#d8d5cd] px-4 py-3 text-[10px] uppercase tracking-widest"><Filter size={14}/> Filters</button><Link href={href({ sort: nextSort === 'newest' ? undefined : nextSort })} className="flex items-center gap-2 border border-[#d8d5cd] px-4 py-3 text-[10px] uppercase tracking-widest"><SlidersHorizontal size={14}/> Sort: {SORTS[sortIndex].label}</Link><button className="hidden items-center gap-2 border border-[#d8d5cd] px-4 py-3 text-[10px] uppercase tracking-widest sm:flex"><Map size={14}/> Map view</button></div></div><div className="mb-10 flex gap-2 overflow-auto pb-2"><Link href={href(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined])))} className={anyFilter ? chipOff : chipOn}>All properties</Link>{chips.map(x=><Link key={x.label} href={x.to} className={x.active ? chipOn : chipOff}>{x.label}</Link>)}</div>{properties.length===0?<div className="py-16 text-center"><p className="font-serif text-3xl">Nothing here just yet.</p><p className="mt-2 text-sm text-[#66716b]">No homes match these filters right now.</p><Link href="/listings" className="mt-6 inline-flex items-center gap-3 border-b border-[#1c2421] pb-2 text-[10px] uppercase tracking-widest text-[#1c2421]">See every home <ArrowUpRight size={14}/></Link></div>:<div className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{properties.map(p=><PropertyCard key={p.id} property={p}/>)}</div>}{pagination.totalPages>1&&<div className="mt-16 flex items-center justify-between border-t border-[#d8d5cd] pt-6 text-[10px] uppercase tracking-widest">{page>1?<Link href={href({ page: String(page-1) })} className="border-b border-[#1c2421] pb-2 text-[#1c2421]">Previous</Link>:<span/>}<span className="text-[#66716b]">Page {page} of {pagination.totalPages}</span>{page<pagination.totalPages?<Link href={href({ page: String(page+1) })} className="border-b border-[#1c2421] pb-2 text-[#1c2421]">Next</Link>:<span/>}</div>}</section></main></>
}
