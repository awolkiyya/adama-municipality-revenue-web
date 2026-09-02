"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getInitials } from "@/utils/getInitials";
import { formatEthiopianDate, formatEthiopianDateWithTime } from "@/lib/utils";
// import { usePrivateImage } from "@/hooks/usePrivateImage";


const formatAmount = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};


// ---- Types -----------------------------------------------------------

type CalculationType = "fixed" | "percentage" | "per_unit" | "range" | "formula";

interface CalculationRow {
  calculationType?: string | null;
  amount?: number | string | null;
  percentage?: number | string | null;
  minValue?: number | string | null;
  maxValue?: number | string | null;
  unit?: string | null;
  formula?: string | null;
}

// ---- Formatting --------------------------------------------------------

/**
 * Derives the display string for a calculation row. Pure function —
 * no JSX, easy to unit test independently of the table renderer.
 */
function formatCalculationValue(row: CalculationRow): string {
  const type = (row.calculationType ?? "").toLowerCase() as CalculationType;

  const formatters: Record<CalculationType, () => string> = {
    fixed: () => formatAmount(row.amount),

    percentage: () =>
      row.percentage == null ? "-" : `${formatAmount(row.percentage)}%`,

    per_unit: () => `${formatAmount(row.amount)} / ${row.unit ?? "unit"}`,

    range: () =>
      `${formatAmount(row.minValue)} – ${formatAmount(row.maxValue)} → ${formatAmount(row.amount)}`,

    formula: () => row.formula ?? "-",
  };

  return formatters[type]?.() ?? "-";
}


export const columnRenderers: Record<string, (row: any) => React.ReactNode> =
{

  
  /* =========================================================
     CORE FIELDS
  ========================================================= */

  avatar: (row) => (
    <Avatar className="h-8 w-8 rounded-lg">
      {/* <AvatarImage src={usePrivateImage(row.avatar).url} alt={row.name} /> */}
      <AvatarFallback className="rounded-lg text-xs">
        {getInitials(row.name)}
      </AvatarFallback>
    </Avatar>
  ),  name: (row) => (
    <span className="block max-w-[180px] truncate text-sm font-medium text-foreground">
      {row.name}
    </span>
  ),

  email: (row) => (
    <span className="block max-w-[220px] truncate text-sm text-muted-foreground">
      {row.email}
    </span>
  ),

  phone: (row) => (
    <span className="block max-w-[140px] truncate text-sm text-muted-foreground">
      {row.phone ?? "-"}
    </span>
  ),

  /* =========================================================
     USER DOMAIN
  ========================================================= */

  role: (row) => (
    <Badge variant="secondary" className="text-xs font-medium">
      {row.role}
    </Badge>
  ),

  level: (row) => (
    <Badge variant="outline" className="text-xs font-medium">
      {row.level}
    </Badge>
  ),

  city: (row) => (
    <span className="block max-w-[160px] truncate text-sm text-foreground">
      {row.city?.name ?? "-"}
    </span>
  ),

  subcity: (row) => (
    <span className="block max-w-[160px] truncate text-sm text-muted-foreground">
      {row.subcity?.name ?? "-"}
    </span>
  ),

  wereda: (row) => (
    <span className="block max-w-[160px] truncate text-sm text-muted-foreground">
      {row.wereda?.name ?? "-"}
    </span>
  ),

  /* =========================================================
     GENERIC FIELDS
  ========================================================= */

  symbol: (row) => (
    <span className="font-mono text-xs text-foreground">
      {row.symbol}
    </span>
  ),

  code: (row) => (
    <span className="block max-w-[120px] truncate font-mono text-xs text-muted-foreground">
      {row.code ?? "-"}
    </span>
  ),

  description: (row) => (
    <p className="block max-w-[300px] truncate text-sm text-muted-foreground">
      {row.description}
    </p>
  ),

  interval_days: (row) => (
    <Badge variant="outline" className="text-xs font-medium">
      {row.interval_days} Days
    </Badge>
  ),

  /* =========================================================
     STATUS
  ========================================================= */

  is_active: (row) => (
    <Badge
      className={
        row.is_active
          ? "bg-emerald-500/90 text-white text-xs font-medium"
          : "bg-red-500/90 text-white text-xs font-medium"
      }
    >
      {row.is_active ? "Active" : "Inactive"}
    </Badge>
  ),

  /* =========================================================
     SYSTEM FIELDS
  ========================================================= */


  last_login_at: (row) => (
    <span className="text-sm text-muted-foreground">
      {row.lastLoginAt
        ? formatEthiopianDateWithTime(row.lastLoginAt)
        : "Never"}
    </span>
  ),

  created_at: (row) => (
    <span className="text-sm text-muted-foreground">
      {row.created_at
        ? formatEthiopianDate(new Date(row.created_at).toLocaleDateString())
        : "-"}
    </span>
  ),
  
   due_date: (row) => (
    <span className="text-sm text-muted-foreground">
      {row.due_date
        ? formatEthiopianDate(new Date(row.due_date).toLocaleDateString())
        : "-"}
    </span>
  ),
  /* =========================================================
     PLAN TEMPLATE DOMAIN
  ========================================================= */

  title: (row) => (
    <span className="block max-w-[220px] truncate text-sm font-medium text-foreground">
      {row.title}
    </span>
  ),

  is_default: (row) => (
    <Badge
      className={
        row.is_default
          ? "bg-blue-500 text-white text-xs font-medium"
          : "bg-muted text-muted-foreground text-xs font-medium"
      }
    >
      {row.is_default ? "Default" : "Custom"}
    </Badge>
  ),


  /* =========================================================
     STATUS
  ========================================================= */

  status: (row) => {
    const status = String(row.status ?? "")
      .toUpperCase()
      .trim();

    const variants: Record<string, string> = {
      /*
      |--------------------------------------------------------------------------
      | ASSESSMENT WORKFLOW
      |--------------------------------------------------------------------------
      */

      DRAFT:
        "bg-slate-500/10 text-slate-600 border-slate-500/20",

      PENDING_APPROVAL:
        "bg-amber-500/10 text-amber-600 border-amber-500/20",

      RETURNED:
        "bg-orange-500/10 text-orange-600 border-orange-500/20",

      APPROVED:
        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",

      CANCELLED:
        "bg-slate-500/10 text-slate-600 border-slate-500/20",

      /*
      |--------------------------------------------------------------------------
      | LEGACY / OTHER WORKFLOW
      |--------------------------------------------------------------------------
      |
      | Keep REJECTED here only if other domains still use it.
      | It should no longer be used for the assessment return flow.
      |
      */

      SUBMITTED:
        "bg-blue-500/10 text-blue-600 border-blue-500/20",

      REJECTED:
        "bg-red-500/10 text-red-600 border-red-500/20",

      /*
      |--------------------------------------------------------------------------
      | SYSTEM
      |--------------------------------------------------------------------------
      */

      ACTIVE:
        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",

      INACTIVE:
        "bg-red-500/10 text-red-600 border-red-500/20",

      /*
      |--------------------------------------------------------------------------
      | PROCESSING
      |--------------------------------------------------------------------------
      */

      PENDING:
        "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",

      PROCESSING:
        "bg-blue-500/10 text-blue-600 border-blue-500/20",

      COMPLETED:
        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",

      FAILED:
        "bg-red-500/10 text-red-600 border-red-500/20",

      /*
      |--------------------------------------------------------------------------
      | PAYMENT
      |--------------------------------------------------------------------------
      */

      PAID:
        "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",

      UNPAID:
        "bg-amber-500/10 text-amber-600 border-amber-500/20",

      OVERDUE:
        "bg-red-500/10 text-red-600 border-red-500/20",

      ISSUED:
        "bg-blue-500/10 text-blue-600 border-blue-500/20",
    };

    /*
    |--------------------------------------------------------------------------
    | HUMAN-READABLE LABELS
    |--------------------------------------------------------------------------
    */

    const labels: Record<string, string> = {
      DRAFT: "Draft",
      PENDING_APPROVAL: "Pending Approval",
      RETURNED: "Returned",
      APPROVED: "Approved",
      CANCELLED: "Cancelled",

      SUBMITTED: "Submitted",
      REJECTED: "Rejected",

      ACTIVE: "Active",
      INACTIVE: "Inactive",

      PENDING: "Pending",
      PROCESSING: "Processing",
      COMPLETED: "Completed",
      FAILED: "Failed",

      PAID: "Paid",
      UNPAID: "Unpaid",
      OVERDUE: "Overdue",
      ISSUED: "Issued",
    };

    const statusClass =
      variants[status] ??
      "bg-muted text-muted-foreground border-border";

    const label =
      labels[status] ??
      (status
        ? status.replaceAll("_", " ")
        : "-");

    return (
      <Badge
        variant="outline"
        className={`text-xs font-medium ${statusClass}`}
      >
        {label}
      </Badge>
    );
  },

  penalty_status: (row) => {
    const status = String(row.penalty_status || "").toUpperCase();
  
    const variants: Record<string, string> = {
      ISSUED: "bg-gray-500/10 text-gray-600",
      PENDING: "bg-amber-500/10 text-amber-600",
      OVERDUE: "bg-red-500/10 text-red-600",
      ESCALATED: "bg-orange-500/10 text-orange-600",
      PAID: "bg-emerald-500/10 text-emerald-600",
      CANCELLED: "bg-slate-500/10 text-slate-600",
    };
  
    return (
      <Badge
        variant="outline"
        className={`text-xs font-medium ${variants[status] || ""}`}
      >
        {status || "-"}
      </Badge>
    );
  },

  created_by: (row) => (
    <span className="text-sm text-muted-foreground">
      {row.created_by ?? "-"}
    </span>
  ),

  registered_at: (row) => (
    <span className="text-sm text-muted-foreground">
      {row.registered_at?formatEthiopianDate(new Date(row.registered_at).toLocaleDateString()): "-"}
    </span>
  ),


  progress: (row) => {
    const value = row.progress ?? 0;

    const variant =
      value >= 100
        ? "bg-emerald-500/10 text-emerald-600"
        : value > 0
        ? "bg-blue-500/10 text-blue-600"
        : "bg-muted text-muted-foreground";

    return (
      <Badge className={`text-xs font-medium ${variant}`}>
        {value}%
      </Badge>
    );
  },

  start_date: (row) => (
    <span className="text-sm text-muted-foreground">
      {row.start_date
        ? formatEthiopianDate(new Date(row.start_date).toLocaleDateString())
        : "-"}
    </span>
  ),

  end_date: (row) => (
    <span className="text-sm text-muted-foreground">
      {row.end_date
        ? formatEthiopianDate(new Date(row.end_date).toLocaleDateString())
        : "-"}
    </span>
  ),

    /* =========================================================
     REVENUE MANAGEMENT DOMAIN
  ========================================================= */

  revenueDomain: (row) => {
    const domain = String(row.revenueDomain || "").toUpperCase();

    const variants: Record<string, string> = {
      TAX: "bg-blue-500/10 text-blue-600",
      RENT: "bg-emerald-500/10 text-emerald-600",
      INVESTMENT: "bg-purple-500/10 text-purple-600",
      SERVICE: "bg-orange-500/10 text-orange-600",
      SALE: "bg-cyan-500/10 text-cyan-600",
      CAPITAL: "bg-pink-500/10 text-pink-600",
    };

    return (
      <Badge
        variant="outline"
        className={`text-xs font-medium ${
          variants[domain] || ""
        }`}
      >
        {domain || "-"}
      </Badge>
    );
  },


  codeRange: (row) => {
    const startCode = row.startCode;
    const endCode = row.endCode;
  
    if (!startCode && !endCode) {
      return (
        <span className="text-sm text-muted-foreground">
          -
        </span>
      );
    }
  
    return (
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className="font-mono text-xs font-medium"
        >
          {startCode ?? "N/A"}
        </Badge>
  
        <span className="text-muted-foreground">
          →
        </span>
  
        <Badge
          variant="outline"
          className="font-mono text-xs font-medium"
        >
          {endCode ?? "N/A"}
        </Badge>
      </div>
    );
  },


  codesCount: (row) => (
    <Badge
      variant="secondary"
      className="text-xs font-medium"
    >
      {row.codesCount ?? 0} Codes
    </Badge>
  ),

  /* =========================================================
   REVENUE SERVICE DOMAIN
========================================================= */

serviceCode: (row) => (
  <div className="flex flex-col">
    <span className="font-medium text-sm text-foreground">
      {row.service?.revenue_code?.code ?? "-"}
    </span>
  </div>
),

revenueCode: (row) => (
  <div className="flex flex-col">
    <span className="font-medium text-sm text-foreground">
      {row.revenueCode?.code ?? "-"}
    </span>
  </div>
),


serviceType: (row) => {
  const type = String(row.serviceType ?? "").toUpperCase();

  const variants: Record<string, string> = {
    REGISTRATION: "bg-blue-500/10 text-blue-600",
    ASSESSMENT: "bg-violet-500/10 text-violet-600",
    PERMIT: "bg-emerald-500/10 text-emerald-600",
    RENEWAL: "bg-cyan-500/10 text-cyan-600",
    COLLECTION: "bg-orange-500/10 text-orange-600",
    PENALTY: "bg-red-500/10 text-red-600",
  };

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${variants[type] ?? ""}`}
    >
      {type.replaceAll("_", " ") || "-"}
    </Badge>
  );
},


collectionMode: (row) => {
  const mode = String(row.collectionMode ?? "").toUpperCase();

  const variants: Record<string, string> = {
    ASSESSMENT_ONLY: "bg-blue-500/10 text-blue-600",
    FIELD_COLLECTION: "bg-emerald-500/10 text-emerald-600",
    BOTH: "bg-violet-500/10 text-violet-600",
  };

  return (
    <Badge
      variant="outline"
      className={`text-xs font-medium ${variants[mode] ?? ""}`}
    >
      {mode.replaceAll("_", " ")}
    </Badge>
  );
},


requiredFields: (row) => {
  const count = row.fields?.length ?? 0;

  return (
    <Badge
      variant="secondary"
      className="text-xs font-medium"
    >
      {count} {count === 1 ? "Field" : "Fields"}
    </Badge>
  );
},

unit: (row) => (
  <div className="flex flex-col">
    <span className="font-medium">
      {row.unit ?? "-"}
    </span>

    <span className="text-xs text-muted-foreground">
      {row.unit_code ?? "_"}
    </span>
  </div>
),

/* =========================================================
   REVENUE TARIFF RULE DOMAIN
========================================================= */

// NOTE: there is no `serviceCode` on a tariff rule row — the API's
// `service` object only exposes `id`/`name`. Don't add a renderer
// for it; it would just silently render "-" forever. Use `serviceName`
// (below) and the rule's own `code` (already handled by the generic
// `code` renderer above) instead.

serviceName: (row) => (
  <span className="block max-w-[180px] truncate text-sm font-medium text-foreground">
    {row.service?.name ?? "-"}
  </span>
),

calculationType: (row) => {
  const type = String(row.calculationType ?? "").toLowerCase();

  const labels: Record<string, string> = {
    fixed: "Fixed",
    percentage: "Percentage",
    per_unit: "Per Unit",
    range: "Range",
    formula: "Formula",
  };

  const variants: Record<string, string> = {
    fixed: "bg-slate-500/10 text-slate-600",
    percentage: "bg-blue-500/10 text-blue-600",
    per_unit: "bg-cyan-500/10 text-cyan-600",
    range: "bg-violet-500/10 text-violet-600",
    formula: "bg-orange-500/10 text-orange-600",
  };

  return (
    <Badge variant="outline" className={`text-xs font-medium ${variants[type] ?? ""}`}>
      {labels[type] ?? type ?? "-"}
    </Badge>
  );
},

// Renders whichever fields are actually populated for the rule's
// calculationType, since amount/percentage/minValue/maxValue/formula
// are never all set at once.

// ---- Column definition ---------------------------------------------

amount: (row: CalculationRow) => {
  const type = (row.calculationType ?? "").toLowerCase();
  const display = formatCalculationValue(row);

  // Formulas are code, not a value — render them distinctly.
  if (type === "formula") {
    return (
      <code
        className="block max-w-[220px] truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground"
        title={display}
      >
        {display}
      </code>
    );
  }

  return (
    <span
      className="block max-w-[220px] truncate text-sm text-foreground"
      title={display}
    >
      {display}
    </span>
  );
},


  /* =========================================================
     INVOICE DOMAIN
  ========================================================= */

  invoice_number: (row) => (
    <span
      className="
        block
        max-w-[180px]
        truncate
        font-mono
        text-sm
        font-medium
        text-foreground
      "
      title={row.invoice_number ?? undefined}
    >
      {row.invoice_number ?? "-"}
    </span>
  ),

  citizen_name: (row) => (
    <div className="flex min-w-0 flex-col">
      <span
        className="
          block
          max-w-[180px]
          truncate
          text-sm
          font-medium
          text-foreground
        "
        title={row.citizen_name ?? undefined}
      >
        {row.citizen_name ?? "-"}
      </span>

      {row.citizen_number &&
        row.citizen_number !== "-" && (
          <span
            className="
              block
              max-w-[180px]
              truncate
              text-xs
              text-muted-foreground
            "
          >
            {row.citizen_number}
          </span>
        )}
    </div>
  ),

  assessment_number: (row) => (
    <span
      className="
        block
        max-w-[180px]
        truncate
        font-mono
        text-xs
        text-muted-foreground
      "
    >
      {row.assessment_number ?? "-"}
    </span>
  ),

  /*
  |--------------------------------------------------------------------------
  | INVOICE AMOUNTS
  |--------------------------------------------------------------------------
  |
  | The invoice API returns financial values like:
  |
  | financial.total_amount
  | financial.paid_amount
  | financial.balance_due
  |
  | The page can flatten them into row.total_amount,
  | row.paid_amount, etc., before reaching this renderer.
  |
  */

  subtotal: (row) => {
    const value =
      row.subtotal ??
      row.financial?.subtotal;

    const currency =
      row.currency ??
      row.financial?.currency ??
      "ETB";

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return (
        <span className="text-sm text-muted-foreground">
          -
        </span>
      );
    }

    return (
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-medium text-foreground">
          {formatAmount(value)}
        </span>

        <span className="text-[10px] font-medium uppercase text-muted-foreground">
          {currency}
        </span>
      </div>
    );
  },

  total_amount: (row) => {
    const value =
      row.financial?.total_amount;


    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return (
        <span className="text-sm text-muted-foreground">
          -
        </span>
      );
    }

    return (
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-semibold text-foreground">
          {formatAmount(value)}
        </span>
      </div>
    );
  },

  paid_amount: (row) => {
    const value =
      row.paid_amount ??
      row.financial?.paid_amount;

    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return (
        <span className="text-sm text-muted-foreground">
          -
        </span>
      );
    }

    return (
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-medium text-emerald-600">
          {formatAmount(value)}
        </span>

      </div>
    );
  },

  balance_due: (row) => {
    const value =
      row.balance_due ??
      row.financial?.balance_due;


    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return (
        <span className="text-sm text-muted-foreground">
          -
        </span>
      );
    }

    const numericValue = Number(value);

    return (
      <div className="flex items-baseline gap-1.5">
        <span
          className={
            numericValue > 0
              ? "text-sm font-semibold text-amber-600"
              : "text-sm font-medium text-emerald-600"
          }
        >
          {formatAmount(value)}
        </span>
      </div>
    );
  },

  /*
  |--------------------------------------------------------------------------
  | CURRENCY
  |--------------------------------------------------------------------------
  */

  currency: (row) => {
    const currency =
      row.currency ??
      row.financial?.currency;

    return (
      <Badge
        variant="outline"
        className="
          font-mono
          text-xs
          font-medium
        "
      >
        {currency ?? "-"}
      </Badge>
    );
  },

  /*
  |--------------------------------------------------------------------------
  | INVOICE SOURCE
  |--------------------------------------------------------------------------
  */

  source_type: (row) => {
    const source =
      String(
        row.source_type ?? "",
      )
        .toUpperCase()
        .trim();

    const variants: Record<
      string,
      string
    > = {
      ASSESSMENT:
        "bg-blue-500/10 text-blue-600 border-blue-500/20",

      DIRECT_COLLECTION:
        "bg-violet-500/10 text-violet-600 border-violet-500/20",
    };

    const labels: Record<
      string,
      string
    > = {
      ASSESSMENT:
        "Assessment",

      DIRECT_COLLECTION:
        "Direct Collection",
    };

    return (
      <Badge
        variant="outline"
        className={`
          text-xs
          font-medium
          ${variants[source] ?? ""}
        `}
      >
        {labels[source] ??
          source.replaceAll("_", " ") ??
          "-"}
      </Badge>
    );
  },

  /*
  |--------------------------------------------------------------------------
  | INVOICE DATE
  |--------------------------------------------------------------------------
  */

  issued_at: (row) => (
    <span className="text-sm text-muted-foreground">
      {row.dates?.issued_at
        ? formatEthiopianDateWithTime(
            new Date(
              row.dates?.issued_at,
            ).toLocaleDateString(),
          )
        : "-"}
    </span>
  ),



};