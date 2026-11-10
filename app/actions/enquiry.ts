'use server'

import { headers } from 'next/headers'
import { postEnquiry, type EnquiryPayload } from '@/lib/api'

export type EnquiryState = { status: 'idle' | 'success' | 'error'; message: string }

const TYPES = ['GENERAL', 'SITE_VISIT', 'CALLBACK', 'BROCHURE', 'PRICE_REQUEST'] as const
const SLOTS = ['MORNING', 'AFTERNOON', 'EVENING'] as const

const field = (fd: FormData, name: string) => {
  const v = fd.get(name)
  return typeof v === 'string' ? v.trim() : ''
}

/** Server action: the browser posts to Next, Next posts to the CRM. The CRM URL and key stay on the server. */
export async function submitEnquiry(_prev: EnquiryState, formData: FormData): Promise<EnquiryState> {
  const type = field(formData, 'enquiryType')
  const slot = field(formData, 'preferredSlot')

  const payload: EnquiryPayload = {
    fullName: field(formData, 'fullName'),
    phone: field(formData, 'phone'),
    email: field(formData, 'email') || undefined,
    message: field(formData, 'message') || undefined,
    propertyId: field(formData, 'propertyId') || undefined,
    enquiryType: (TYPES as readonly string[]).includes(type) ? (type as EnquiryPayload['enquiryType']) : 'GENERAL',
    preferredDate: field(formData, 'preferredDate') || undefined,
    preferredSlot: (SLOTS as readonly string[]).includes(slot) ? (slot as EnquiryPayload['preferredSlot']) : undefined,
    // Honeypot: passed through untouched; the API silently drops filled ones.
    companyWebsite: field(formData, 'companyWebsite'),
  }

  const h = await headers()
  const clientIp = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null

  try {
    const result = await postEnquiry(payload, clientIp)
    return result.ok ? { status: 'success', message: result.message } : { status: 'error', message: result.message }
  } catch {
    return { status: 'error', message: 'We could not reach our team just now. Please try again or call us.' }
  }
}
