
// // =====================================================
// // MOCK TAXPAYERS
// // Replace with API
// // =====================================================

// import { AssessmentTaxpayer, RevenueService, } from "@/types/revenue/assessment";

// export const MOCK_TAXPAYERS: AssessmentTaxpayer[] = [
//     {
//       id: "tp_001",
//       name: "Abebe Bekele Trading PLC",
//       tin: "0012345678",
//       phone: "+251 91 234 5678",
//       address: "Adama, Kebele 03",
//       business_type: "Wholesale Trade",
//     },
//     {
//       id: "tp_002",
//       name: "Nazret General Merchandise",
//       tin: "0098765432",
//       phone: "+251 92 345 6789",
//       address: "Adama, Kebele 05",
//       business_type: "Retail Trade",
//     },
//     {
//       id: "tp_003",
//       name: "Oromia Construction Share Co.",
//       tin: "0011223344",
//       phone: "+251 93 456 7890",
//       address: "Adama, Industry Zone",
//       business_type: "Construction",
//     },
//     {
//       id: "tp_004",
//       name: "Fantu Hair & Beauty Salon",
//       tin: "0077889900",
//       phone: "+251 94 567 8901",
//       address: "Adama, Kebele 01",
//       business_type: "Personal Services",
//     },
//   ];
  
//   // =====================================================
//   // MOCK REVENUE SERVICES
//   // Replace with API. Note: no baseAmount / unitRate /
//   // percentageRate here — pricing data belongs to the
//   // decision provider, not this form.
//   // =====================================================
  
//   export  const MOCK_REVENUE_SERVICES: RevenueService[] = [
//     {
//       id: "rs_001",
//       name: "Business License Renewal Fee",
//       code: "REV-BL-001",
//       category: "Licensing",
//       pricingMethod: "FLAT",
//       description:
//         "Fixed annual fee for renewing an existing business license.",
//       fields: [
//         {
//           id: "f_business_license",
//           key: "license_number",
//           label: "Existing License Number",
//           type: "TEXT",
//           required: true,
//           placeholder: "Enter existing license number",
//         },
//         {
//           id: "f_business_category",
//           key: "business_category",
//           label: "Business Category",
//           type: "SELECT",
//           required: true,
//           options: [
//             { label: "Retail", value: "RETAIL" },
//             { label: "Wholesale", value: "WHOLESALE" },
//             { label: "Manufacturing", value: "MANUFACTURING" },
//             { label: "Services", value: "SERVICES" },
//           ],
//         },
//         {
//           id: "f_license_document",
//           key: "license_document",
//           label: "Current Business License",
//           type: "FILE",
//           required: true,
//           accept: ".pdf,.jpg,.jpeg,.png",
//         },
//       ],
//     },
  
//     {
//       id: "rs_002",
//       name: "Land Lease Tax",
//       code: "REV-LT-014",
//       category: "Land & Property",
//       pricingMethod: "PER_UNIT",
//       description: "Charged according to the leased municipal land area.",
//       fields: [
//         {
//           id: "f_land_area",
//           key: "land_area",
//           label: "Leased Land Area",
//           type: "DECIMAL",
//           required: true,
//           unit: "m²",
//           min: 0,
//           step: 0.01,
//         },
//         {
//           id: "f_land_use",
//           key: "land_use",
//           label: "Land Use Type",
//           type: "SELECT",
//           required: true,
//           options: [
//             { label: "Commercial", value: "COMMERCIAL" },
//             { label: "Residential", value: "RESIDENTIAL" },
//             { label: "Industrial", value: "INDUSTRIAL" },
//           ],
//         },
//         {
//           id: "f_contract_date",
//           key: "contract_date",
//           label: "Lease Contract Date",
//           type: "DATE",
//           required: true,
//         },
//         {
//           id: "f_lease_document",
//           key: "lease_document",
//           label: "Lease Agreement",
//           type: "FILE",
//           required: true,
//           accept: ".pdf,.jpg,.jpeg,.png",
//         },
//       ],
//     },
  
//     {
//       id: "rs_003",
//       name: "Outdoor Advertisement Permit",
//       code: "REV-AD-009",
//       category: "Permits",
//       pricingMethod: "PER_UNIT",
//       description:
//         "Advertisement permit charged according to the number of display days.",
//       fields: [
//         {
//           id: "f_ad_days",
//           key: "display_days",
//           label: "Display Duration",
//           type: "NUMBER",
//           required: true,
//           unit: "days",
//           min: 1,
//         },
//         {
//           id: "f_ad_type",
//           key: "advertisement_type",
//           label: "Advertisement Type",
//           type: "SELECT",
//           required: true,
//           options: [
//             { label: "Billboard", value: "BILLBOARD" },
//             { label: "Wall Advertisement", value: "WALL" },
//             { label: "Digital Screen", value: "DIGITAL" },
//             { label: "Banner", value: "BANNER" },
//           ],
//         },
//         {
//           id: "f_has_lighting",
//           key: "has_lighting",
//           label: "Illuminated Advertisement",
//           type: "CHECKBOX",
//           required: false,
//         },
//         {
//           id: "f_ad_photo",
//           key: "advertisement_photo",
//           label: "Advertisement Photo",
//           type: "FILE",
//           required: true,
//           accept: ".jpg,.jpeg,.png",
//         },
//       ],
//     },
  
//     {
//       id: "rs_004",
//       name: "Municipal Service Charge",
//       code: "REV-MS-004",
//       category: "Municipal Services",
//       pricingMethod: "PERCENTAGE",
//       description:
//         "Municipal charge calculated as a percentage of the declared transaction value.",
//       fields: [
//         {
//           id: "f_transaction_value",
//           key: "transaction_value",
//           label: "Transaction Value",
//           type: "DECIMAL",
//           required: true,
//           unit: "ETB",
//           min: 0,
//           step: 0.01,
//         },
//         {
//           id: "f_transaction_type",
//           key: "transaction_type",
//           label: "Transaction Type",
//           type: "RADIO",
//           required: true,
//           options: [
//             { label: "Sale", value: "SALE" },
//             { label: "Service", value: "SERVICE" },
//             { label: "Contract", value: "CONTRACT" },
//           ],
//         },
//         {
//           id: "f_transaction_document",
//           key: "transaction_document",
//           label: "Supporting Document",
//           type: "FILE",
//           required: true,
//           accept: ".pdf,.jpg,.jpeg,.png",
//         },
//       ],
//     },
  
//     {
//       id: "rs_005",
//       name: "Commercial Building Permit",
//       code: "REV-BP-021",
//       category: "Construction",
//       pricingMethod: "FORMULA",
//       description:
//         "Assessment calculated using building area, floors and construction type.",
//       fields: [
//         {
//           id: "f_building_area",
//           key: "building_area",
//           label: "Building Area",
//           type: "DECIMAL",
//           required: true,
//           unit: "m²",
//           min: 0,
//           step: 0.01,
//         },
//         {
//           id: "f_floor_count",
//           key: "floor_count",
//           label: "Number of Floors",
//           type: "NUMBER",
//           required: true,
//           min: 1,
//         },
//         {
//           id: "f_construction_type",
//           key: "construction_type",
//           label: "Construction Type",
//           type: "SELECT",
//           required: true,
//           options: [
//             { label: "Standard", value: "STANDARD" },
//             { label: "Premium", value: "PREMIUM" },
//             { label: "Industrial", value: "INDUSTRIAL" },
//           ],
//         },
//         {
//           id: "f_has_basement",
//           key: "has_basement",
//           label: "Includes Basement",
//           type: "CHECKBOX",
//         },
//         {
//           id: "f_site_plan",
//           key: "site_plan",
//           label: "Site Plan",
//           type: "FILE",
//           required: true,
//           accept: ".pdf,.jpg,.jpeg,.png",
//         },
//         {
//           id: "f_supporting_documents",
//           key: "supporting_documents",
//           label: "Supporting Documents",
//           type: "MULTI_FILE",
//           required: false,
//           accept: ".pdf,.jpg,.jpeg,.png",
//           multiple: true,
//         },
//         {
//           id: "f_engineer_notes",
//           key: "engineer_notes",
//           label: "Engineer / Site Notes",
//           type: "TEXTAREA",
//           required: false,
//         },
//       ],
//     },
//   ];
  
//   export  const PRICING_METHOD_LABEL: Record<PricingMethod, string> = {
//     FLAT: "Flat fee",
//     PER_UNIT: "Per unit",
//     PERCENTAGE: "Percentage",
//     RANGE: "Range-based",
//     FORMULA: "Formula-based",
//   };
  

//  export const taxpayers: Taxpayer[] = [ { id: "1", name: "Abdulrahman Trading", tin: "0012345678", phone: "0911223344", business_type: "Retail", address: "Adama, Zone 01", }, { id: "2", name: "Oromia Construction PLC", tin: "0098765432", phone: "0911556677", business_type: "Construction", address: "Adama, Zone 02", }, ];