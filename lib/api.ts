import 'server-only'
import type { Localities, Property, PropertyList } from './properties'

/**
 * Server-only client for the CRM public API.
 * `server-only` makes the build fail if this file is ever imported into a
 * client component, so CRM_API_URL and PUBLIC_API_KEY can't reach the browser.
 */

export const REVALIDATE_SECONDS = 300

function config() {
  const base = process.env.CRM_API_URL
  if (!base) throw new Error('CRM_API_URL is not set (see .env.example)')
  return { base: base.replace(/\/+$/, ''), key: process.env.PUBLIC_API_KEY ?? '' }
}

type Envelope<T> = { success: true; data: T } | { success: false; message: string; errors?: { path: string; message: string }[] }

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T | null> {
  const { base, key } = config()
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(params ?? {})) if (v !== undefined && v !== '') qs.set(k, String(v))
  const url = `${base}/api/public${path}${qs.size ? `?${qs}` : ''}`

  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'X-Public-Api-Key': key },
    next: { revalidate: REVALIDATE_SECONDS, tags: ['listings'] },
  })
  if (res.status === 404) return null
  const body = (await res.json().catch(() => null)) as Envelope<T> | null
  if (!res.ok || !body || !body.success) {
    // Throwing during an ISR revalidation keeps serving the last good page.
    throw new ApiError(body && !body.success ? body.message : `CRM API ${res.status} for ${path}`, res.status)
  }
  return body.data
}

export type ListingQuery = {
  page?: number
  limit?: number
  locality?: string
  city?: string
  propertyType?: string
  listingType?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  furnishing?: string
  possessionStatus?: string
  amenities?: string
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'area_desc' | 'area_asc'
}

const EMPTY_LIST: PropertyList = { properties: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } }

export async function getProperties(query: ListingQuery = {}): Promise<PropertyList> {
  return (await get<PropertyList>('/properties', query)) ?? EMPTY_LIST
}

export async function getProperty(slug: string): Promise<Property | null> {
  return get<Property>(`/properties/${encodeURIComponent(slug)}`)
}

export async function getSimilarProperties(slug: string): Promise<Property[]> {
  return (await get<Property[]>(`/properties/${encodeURIComponent(slug)}/similar`)) ?? []
}

export async function getLocalities(): Promise<Localities> {
  return (await get<Localities>('/localities')) ?? { localities: [], cities: [] }
}

export type EnquiryPayload = {
  fullName: string
  phone: string
  email?: string
  message?: string
  propertyId?: string
  enquiryType: 'GENERAL' | 'SITE_VISIT' | 'CALLBACK' | 'BROCHURE' | 'PRICE_REQUEST'
  preferredDate?: string
  preferredSlot?: 'MORNING' | 'AFTERNOON' | 'EVENING'
  companyWebsite?: string
}

/** POST an enquiry, forwarding the visitor's IP so the API rate-limits per visitor. */
export async function postEnquiry(payload: EnquiryPayload, clientIp: string | null) {
  const { base, key } = config()
  const res = await fetch(`${base}/api/public/enquiries`, {
    method: 'POST',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Public-Api-Key': key,
      ...(clientIp && { 'X-Client-IP': clientIp }),
    },
    body: JSON.stringify(payload),
  })
  const body = (await res.json().catch(() => null)) as Envelope<{ message: string }> | null
  if (res.ok && body?.success) return { ok: true as const, message: body.data.message }
  const message =
    (body && !body.success && (body.errors?.[0]?.message ?? body.message)) ||
    'Something went wrong. Please try again or call us.'
  return { ok: false as const, message }
}
