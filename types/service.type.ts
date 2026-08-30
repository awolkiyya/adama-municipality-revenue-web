import { Landmark, Receipt, TriangleAlert, BadgeCheck, HelpCircle } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types — mirrors the revenue_services migration
// ---------------------------------------------------------------------------

export type ServiceType = 'TAX' | 'FEE' | 'PENALTY' | 'LICENSE'

export type CollectionMode = 'ASSESSMENT_ONLY' | 'FIELD_COLLECTION' | 'BOTH'

export interface RequiredField {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'boolean'
  required: boolean
}

export interface RevenueCodeRef {
  id: string
  code: string
  name: string
}

export interface RevenueService {
  id: string
  revenue_code_id: string
  revenue_code: RevenueCodeRef
  name: string
  description: string | null
  service_type: ServiceType | null
  required_fields: RequiredField[]
  collection_mode: CollectionMode
  is_active: boolean
  created_by_name?: string | null
  updated_at: string
}

// ---------------------------------------------------------------------------
// Metadata — service_type (nullable, so include an "Unspecified" fallback)
// ---------------------------------------------------------------------------

export const SERVICE_TYPE_META: Record<ServiceType, { label: string; icon: React.ElementType; className: string }> = {
  TAX: { label: 'Tax', icon: Landmark, className: 'bg-red-500/10 text-red-600' },
  FEE: { label: 'Fee', icon: Receipt, className: 'bg-blue-500/10 text-blue-600' },
  PENALTY: { label: 'Penalty', icon: TriangleAlert, className: 'bg-amber-500/10 text-amber-600' },
  LICENSE: { label: 'License', icon: BadgeCheck, className: 'bg-violet-500/10 text-violet-600' },
}

export const SERVICE_TYPE_OPTIONS: ServiceType[] = ['TAX', 'FEE', 'PENALTY', 'LICENSE']

export const UNSPECIFIED_TYPE_META = {
  label: 'Unspecified',
  icon: HelpCircle,
  className: 'bg-muted text-muted-foreground',
}

// ---------------------------------------------------------------------------
// Collection mode metadata
// ---------------------------------------------------------------------------

export const COLLECTION_MODE_META: Record<CollectionMode, { label: string; className: string }> = {
  ASSESSMENT_ONLY: { label: 'Assessment Only', className: 'bg-slate-500/10 text-slate-600' },
  FIELD_COLLECTION: { label: 'Field Collection', className: 'bg-cyan-500/10 text-cyan-600' },
  BOTH: { label: 'Assessment + Field', className: 'bg-emerald-500/10 text-emerald-600' },
}

export const COLLECTION_MODE_OPTIONS: CollectionMode[] = ['ASSESSMENT_ONLY', 'FIELD_COLLECTION', 'BOTH']

// ---------------------------------------------------------------------------
// Mock data — replace with your real API layer, e.g.:
//   useGetRevenueServicesQuery()
//   useGetRevenueCodesQuery()   (for the revenue_code_id select)
//   useCreateRevenueServiceMutation()
//   useUpdateRevenueServiceMutation()
//   useDeleteRevenueServiceMutation()
// ---------------------------------------------------------------------------

export const MOCK_REVENUE_CODES: RevenueCodeRef[] = [
  { id: 'rc-1', code: '1701', name: 'Warehouse Property Tax' },
  { id: 'rc-2', code: '1801', name: 'Municipal Rental Income' },
  { id: 'rc-3', code: '1901', name: 'Administrative Service Fee' },
]

export const MOCK_SERVICES: RevenueService[] = [
  {
    id: 's-1',
    revenue_code_id: 'rc-1',
    revenue_code: MOCK_REVENUE_CODES[0],
    name: 'Warehouse Tax Assessment',
    description: 'Annual property tax assessment for registered warehouse facilities.',
    service_type: 'TAX',
    required_fields: [
      { key: 'plate_number', label: 'Plate Number', type: 'text', required: true },
      { key: 'floor_area', label: 'Floor Area (m²)', type: 'number', required: true },
    ],
    collection_mode: 'ASSESSMENT_ONLY',
    is_active: true,
    created_by_name: 'Abebe Kebede',
    updated_at: '2026-06-02',
  },
  {
    id: 's-2',
    revenue_code_id: 'rc-2',
    revenue_code: MOCK_REVENUE_CODES[1],
    name: 'Municipal Property Rental',
    description: 'Monthly rent collection for municipally owned commercial spaces.',
    service_type: 'FEE',
    required_fields: [{ key: 'lease_id', label: 'Lease ID', type: 'text', required: true }],
    collection_mode: 'BOTH',
    is_active: true,
    created_by_name: 'Sara Tesfaye',
    updated_at: '2026-05-28',
  },
  {
    id: 's-3',
    revenue_code_id: 'rc-3',
    revenue_code: MOCK_REVENUE_CODES[2],
    name: 'Business License Renewal',
    description: 'Annual renewal service for commercial business operating licenses.',
    service_type: 'LICENSE',
    required_fields: [
      { key: 'license_number', label: 'License Number', type: 'text', required: true },
      { key: 'renewal_date', label: 'Renewal Date', type: 'date', required: true },
      { key: 'category', label: 'Business Category', type: 'select', required: false },
    ],
    collection_mode: 'FIELD_COLLECTION',
    is_active: true,
    created_by_name: 'Abebe Kebede',
    updated_at: '2026-06-10',
  },
  {
    id: 's-4',
    revenue_code_id: 'rc-1',
    revenue_code: MOCK_REVENUE_CODES[0],
    name: 'Late Filing Penalty',
    description: 'Penalty applied for warehouse tax filings submitted after the deadline.',
    service_type: 'PENALTY',
    required_fields: [],
    collection_mode: 'ASSESSMENT_ONLY',
    is_active: false,
    created_by_name: 'Sara Tesfaye',
    updated_at: '2026-04-15',
  },
]