// Types + formatters only. No data lives here any more: listings come from the
// CRM public API via lib/api.ts (server-only). Safe to import from client components.

export type Property = {
  id: string
  slug: string
  title: string
  description: string
  propertyType: 'APARTMENT' | 'VILLA' | 'PLOT' | 'COMMERCIAL' | 'OTHER'
  listingType: 'SALE' | 'RENT'
  status: 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'SOLD'
  price: number
  pricePerSqft: number | null
  bedrooms: number | null
  bathrooms: number | null
  carpetArea: number | null
  furnishing: 'UNFURNISHED' | 'SEMI_FURNISHED' | 'FURNISHED' | null
  floor: number | null
  totalFloors: number | null
  possessionStatus: 'READY_TO_MOVE' | 'UNDER_CONSTRUCTION'
  possessionDate: string | null
  locality: string | null
  city: string
  state: string
  amenities: string[]
  images: string[]
  reraId: string | null
  project: { name: string; builderName: string } | null
  isFeatured: boolean
  isVerified: boolean
  createdAt: string
}

export type Pagination = { page: number; limit: number; total: number; totalPages: number }

export type PropertyList = { properties: Property[]; pagination: Pagination }

export type Localities = {
  localities: { locality: string; city: string; count: number }[]
  cities: { city: string; count: number }[]
}

export const PLACEHOLDER_IMAGE = '/placeholder.jpg'

/** images[i], falling back to the first image, then the placeholder. */
export const imageAt = (p: Property, i: number) => p.images[i] ?? p.images[0] ?? PLACEHOLDER_IMAGE

export const formatPrice = (price:number) => price >= 10000000 ? `₹${(price/10000000).toFixed(price%10000000===0?0:2)} Cr` : price >= 100000 ? `₹${(price/100000).toFixed(price%100000===0?0:1)} L` : `₹${new Intl.NumberFormat('en-IN').format(price)}`
export const formatNumber = (value:number) => new Intl.NumberFormat('en-IN').format(value)
