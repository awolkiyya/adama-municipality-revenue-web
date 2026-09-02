
import {
    ShieldCheck,
    Calculator,
    XCircle,
    FilePlus2,
    SendHorizonal,
    BadgeCheck,
    Wallet,
    CheckCircle2,
    PencilLine,
  } from "lucide-react";
  
  import { LucideIcon } from "lucide-react";
  export type ServiceAction =
  | "CREATE"
  | "UPDATE"
  | "SUBMIT"
  | "VERIFY"
  | "ASSESS"
  | "APPROVE"
  | "REJECT"
  | "PAYMENT"
  | "COMPLETE"
  | "CANCEL";


export interface ServiceAccessRuleRelation {
  id: string;
  name: string;
}


export interface ServiceAccessRule {
  id: string;

  service: ServiceAccessRuleRelation;

  sector: ServiceAccessRuleRelation;

  role: ServiceAccessRuleRelation;

  actions: ServiceAction[];

  isActive: boolean;

  createdAt: string;

  updatedAt: string;
}


// payload
export interface CreateServiceAccessRulePayload {
  sector_id: string;

  role_id: number;

  actions: ServiceAction[];

  is_active?: boolean;
}


export interface UpdateServiceAccessRulePayload {
  sector_id?: string;

  role_id?: number;

  actions?: ServiceAction[];

  is_active?: boolean;
}

  
  type ActionTone = "blue" | "indigo" | "amber" | "emerald" | "purple" | "rose";

  interface ActionDef {
    id: string;
    code: string;
    name: string;
    description: string;
    icon: LucideIcon;
    tone: ActionTone;
  }
  
  interface ToneStyle {
    chip: string;
    chipActive: string;
    icon: string;
    iconActive: string;
    ring: string;
  }
  
  
  export const ACTIONS: ActionDef[] = [
    {
      id: "CREATE",
      code: "CREATE",
      name: "Create Request",
      description: "Create citizen service request.",
      icon: FilePlus2,
      tone: "blue",
    },
  
    {
      id: "UPDATE",
      code: "UPDATE",
      name: "Update Request",
      description: "Update citizen service request.",
      icon: PencilLine,
      tone: "indigo",
    },
  
    // {
    //   id: "SUBMIT",
    //   code: "SUBMIT",
    //   name: "Submit Request",
    //   description: "Submit request for assessment.",
    //   icon: SendHorizonal,
    //   tone: "purple",
    // },
  
    // {
    //   id: "VERIFY",
    //   code: "VERIFY",
    //   name: "Verify Documents",
    //   description: "Verify submitted documents.",
    //   icon: ShieldCheck,
    //   tone: "blue",
    // },
  
    // {
    //   id: "ASSESS",
    //   code: "ASSESS",
    //   name: "Perform Assessment",
    //   description: "Calculate payable amount.",
    //   icon: Calculator,
    //   tone: "amber",
    // },
  
    // {
    //   id: "APPROVE",
    //   code: "APPROVE",
    //   name: "Approve Request",
    //   description: "Approve assessment or service request.",
    //   icon: BadgeCheck,
    //   tone: "emerald",
    // },
  
    // {
    //   id: "REJECT",
    //   code: "REJECT",
    //   name: "Reject Request",
    //   description: "Reject invalid request.",
    //   icon: XCircle,
    //   tone: "rose",
    // },
  
    // {
    //   id: "PAYMENT",
    //   code: "PAYMENT",
    //   name: "Process Payment",
    //   description: "Receive payment and issue receipt.",
    //   icon: Wallet,
    //   tone: "purple",
    // },
  
    // {
    //   id: "COMPLETE",
    //   code: "COMPLETE",
    //   name: "Complete Service",
    //   description: "Mark service workflow as completed.",
    //   icon: CheckCircle2,
    //   tone: "emerald",
    // },
  
    // {
    //   id: "CANCEL",
    //   code: "CANCEL",
    //   name: "Cancel Request",
    //   description: "Cancel service request.",
    //   icon: XCircle,
    //   tone: "rose",
    // },
  ];
  
 export const TONE_STYLES: Record<ActionTone, ToneStyle> = {
    blue: {
      chip: "bg-blue-500/10",
      chipActive: "bg-blue-500",
      icon: "text-blue-600 dark:text-blue-400",
      iconActive: "text-white",
      ring: "border-blue-500/60 bg-blue-500/5 ring-1 ring-blue-500/30",
    },
    indigo: {
      chip: "bg-indigo-500/10",
      chipActive: "bg-indigo-500",
      icon: "text-indigo-600 dark:text-indigo-400",
      iconActive: "text-white",
      ring: "border-indigo-500/60 bg-indigo-500/5 ring-1 ring-indigo-500/30",
    },
    amber: {
      chip: "bg-amber-500/10",
      chipActive: "bg-amber-500",
      icon: "text-amber-600 dark:text-amber-400",
      iconActive: "text-white",
      ring: "border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30",
    },
    emerald: {
      chip: "bg-emerald-500/10",
      chipActive: "bg-emerald-500",
      icon: "text-emerald-600 dark:text-emerald-400",
      iconActive: "text-white",
      ring: "border-emerald-500/60 bg-emerald-500/5 ring-1 ring-emerald-500/30",
    },
    purple: {
      chip: "bg-purple-500/10",
      chipActive: "bg-purple-500",
      icon: "text-purple-600 dark:text-purple-400",
      iconActive: "text-white",
      ring: "border-purple-500/60 bg-purple-500/5 ring-1 ring-purple-500/30",
    },
    rose: {
      chip: "bg-rose-500/10",
      chipActive: "bg-rose-500",
      icon: "text-rose-600 dark:text-rose-400",
      iconActive: "text-white",
      ring: "border-rose-500/60 bg-rose-500/5 ring-1 ring-rose-500/30",
    },
  };

  export interface ServiceAccessRuleSummary {
    total: number;
  
    sectors: number;
  
    active: number;
  
    inactive: number;
  }