import type { Metadata } from 'next'
import { Cormorant_Garamond, Manrope } from 'next/font/google'
import './globals.css'
const manrope=Manrope({subsets:['latin'],variable:'--font-manrope'})
const cormorant=Cormorant_Garamond({subsets:['latin'],variable:'--font-cormorant',weight:['400','500','600','700']})
export const metadata: Metadata={title:{default:'Signature Estates — Homes with a point of view',template:'%s — Signature Estates'},description:'A considered collection of exceptional homes across India.'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body className={`${manrope.variable} ${cormorant.variable}`}>{children}</body></html>}
