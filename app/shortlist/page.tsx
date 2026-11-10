import Link from 'next/link'
import { Heart, ArrowUpRight } from 'lucide-react'
import { Header, PropertyCard } from '@/components/site'
import { getProperties } from '@/lib/api'

export const revalidate = 300

export default async function Shortlist(){const { properties } = await getProperties({ limit: 2 });return <><Header/><main className="pt-20"><section className="bg-[#1c2421] px-5 py-20 text-white lg:px-10"><div className="mx-auto max-w-7xl"><p className="text-[10px] uppercase tracking-[.3em] text-[#cbb892]">Your private collection</p><h1 className="display-title mt-4 text-7xl leading-none md:text-9xl">Shortlisted<br/><i>for you.</i></h1></div></section><section className="mx-auto max-w-7xl px-5 py-16 lg:px-10"><div className="mb-10 flex items-center justify-between"><p className="text-sm text-[#66716b]">Save a property to begin building your collection.</p><Link href="/listings" className="flex items-center gap-2 text-[10px] uppercase tracking-widest">Browse homes <ArrowUpRight size={14}/></Link></div><div className="grid gap-6 md:grid-cols-3">{properties.slice(0,2).map(p=><PropertyCard key={p.id} property={p}/>)}</div></section></main></>}
