import { PenaltyRule, RevenueService } from "@/types/revenue/penality.";

  
  export const MOCK_SERVICES: RevenueService[] = [
    {
      id: "service-lizz",
      name: "Lizz",
    },
    {
      id: "service-business",
      name: "Business License",
    },
    {
      id: "service-market",
      name: "Market Service",
    },
    {
      id: "service-advertisement",
      name: "Advertisement",
    },
  ];
  
  export const MOCK_RULES: PenaltyRule[] = [
    {
      id: "penalty-default-2026",
  
      revenue_service_id: null,
  
      name: "Default Progressive Penalty",
  
      calculation_type: "PROGRESSIVE",
  
      initial_rate: 5,
      increment_rate: 2,
      maximum_rate: 25,
  
      start_type: "AFTER_GRACE_PERIOD",
  
      grace_period_value: 7,
      grace_period_unit: "MONTH",
  
      increment_period: "MONTH",
  
      calculation_basis: "PRINCIPAL",
  
      effective_from: "2026-07-08",
      effective_to: null,
  
      is_active: true,
  
      legal_reference:
        "Revenue Regulation 2026",
  
      description:
        "Default progressive penalty applied to revenue services after the applicable grace period.",
    },
  
    {
      id: "penalty-lizz-2026",
  
      revenue_service_id:
        "service-lizz",
  
      name: "Lizz Progressive Penalty",
  
      calculation_type: "PROGRESSIVE",
  
      initial_rate: 5,
      increment_rate: 2,
      maximum_rate: 25,
  
      start_type: "AGREEMENT_START",
  
      grace_period_value: 0,
      grace_period_unit: "MONTH",
  
      increment_period: "MONTH",
  
      calculation_basis: "PRINCIPAL",
  
      effective_from: "2026-07-08",
      effective_to: null,
  
      is_active: true,
  
      legal_reference:
        "Lizz Revenue Directive",
  
      description:
        "Special penalty policy for Lizz based on the agreement start date.",
  
      revenue_service:
        MOCK_SERVICES[0],
    },
  ];