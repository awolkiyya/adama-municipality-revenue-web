import { RevenueService, Taxpayer } from "@/types/existing-agreement"

export const revenueServices: RevenueService[] = [
  {
    id: "lizz-land-lease",
    name: "Land Lease (LIZZ)",
    code: "1731",
  },
  {
    id: "other-land-lease",
    name: "Other Land Lease",
    code: "1732",
  },
]

export const taxpayers: Taxpayer[] = [
  {
    id: "taxpayer-001",
    name: "Abebe Kebede",
    tin: "0012345678",
    type: "Individual",
  },
  {
    id: "taxpayer-002",
    name: "Hawa Mohammed",
    tin: "0023456789",
    type: "Individual",
  },
  {
    id: "taxpayer-003",
    name: "Adama Construction PLC",
    tin: "0034567890",
    type: "Business",
  },
]