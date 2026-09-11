"use client";

import React, { useMemo, useState } from "react";

import {
  Check,
  CheckCircle2,
  FileText,
  Info,
  MoreHorizontal,
  Pencil,
  Search,
  Tag,
  User,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// =========================================================
// TYPES
// =========================================================

type CollectionStatus =
  | "PENDING"
  | "PARTIALLY_PAID"
  | "COLLECTED"
  | "CANCELLED";

type BaseFieldDataType =
  | "TEXT"
  | "NUMBER"
  | "DECIMAL"
  | "SELECT"
  | "RADIO"
  | "CHECKBOX"
  | "BOOLEAN"
  | "DATE"
  | "FILE";

type CollectionMode =
  | "ASSESSMENT_ONLY"
  | "COLLECTION_ONLY"
  | "ASSESSMENT_AND_COLLECTION";

type BaseFieldOption = {
  value: string;
  label: string;
};

type ServiceBaseField = {
  id: string;
  name: string;
  code: string;
  dataType: BaseFieldDataType;
  required: boolean;
  placeholder?: string;
  unit?: string;
  options?: BaseFieldOption[];
};

type RevenueService = {
  id: string;
  name: string;
  revenueDomain: string;
  collectionMode: CollectionMode;
  baseFields: ServiceBaseField[];
};

type Taxpayer = {
  id: string;
  name: string;
  phone: string;
  address: string;
};

type CollectionRecord = {
  id: string;
  invoiceNumber: string;

  taxpayerId: string;
  taxpayerName: string;
  taxpayerPhone: string;

  serviceId: string;
  serviceName: string;
  revenueDomain: string;

  tariffCode: string;
  tariffName: string;
  tariffUnit: string;
  tariffRate: number;
  quantity: number;

  amount: number;
  paidAmount: number;
  balance: number;

  dueDate: string;
  status: CollectionStatus;
  createdAt: string;
};

type ServerCollectionResult = {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: CollectionStatus;

    subtotal: number;
    penaltyAmount: number;
    discountAmount: number;
    totalAmount: number;

    paidAmount: number;
    balanceDue: number;
  };

  tariff: {
    code: string;
    name: string;
    rate: number;
    unit: string;
  };
};

// =========================================================
// MOCK REVENUE SERVICES
// =========================================================

const MOCK_REVENUE_SERVICES: RevenueService[] = [
  {
    id: "service-cleanliness",
    name: "Cleanliness Service Fee",
    revenueDomain: "SERVICE",
    collectionMode: "ASSESSMENT_AND_COLLECTION",

    baseFields: [
      {
        id: "field-customer",
        name: "Customer Category",
        code: "CUSTOMER",
        dataType: "SELECT",
        required: true,
        options: [
          {
            value: "MANA_JIREENYAA",
            label: "Mana Jireenyaa",
          },
          {
            value: "DALDALAA",
            label: "Daldalaa",
          },
          {
            value:
              "DHAABBILEE_MOOTUMMAA_/_DHAABBILEE_MITI-MOOTUMMAA",
            label:
              "Dhaabbilee Mootummaa / Dhaabbilee Miti-Mootummaa",
          },
          {
            value: "INDUSTIRIIWWAN_GUGUDDOO",
            label: "Industiriiwwan Guguddoo",
          },
          {
            value: "HORSIISA_LOONII",
            label: "Horsiisa Loonii",
          },
          {
            value:
              "INDUSTIRIIWWAN_XIXIQQAA_/_GIDDUGALEESSAA",
            label:
              "Industiriiwwan Xixiqqaa / Giddugaleessaa",
          },
        ],
      },

      {
        id: "field-quantity",
        name: "Quantity",
        code: "QUANTITY",
        dataType: "NUMBER",
        required: true,
        unit: "pcs",
        placeholder: "Enter quantity",
      },
    ],
  },

  {
    id: "service-market",
    name: "Market Service Fee",
    revenueDomain: "SERVICE",
    collectionMode: "ASSESSMENT_AND_COLLECTION",

    baseFields: [
      {
        id: "field-market-type",
        name: "Market Type",
        code: "MARKET_TYPE",
        dataType: "SELECT",
        required: true,
        options: [
          {
            value: "RETAIL",
            label: "Retail Market",
          },
          {
            value: "WHOLESALE",
            label: "Wholesale Market",
          },
        ],
      },

      {
        id: "field-stall-count",
        name: "Stall Count",
        code: "STALL_COUNT",
        dataType: "NUMBER",
        required: true,
        unit: "pcs",
        placeholder: "Enter stall count",
      },
    ],
  },

  {
    id: "service-hospitality",
    name: "Hospitality Service Fee",
    revenueDomain: "SERVICE",
    collectionMode: "ASSESSMENT_AND_COLLECTION",

    baseFields: [
      {
        id: "field-property-type",
        name: "Property Type",
        code: "PROPERTY_TYPE",
        dataType: "SELECT",
        required: true,
        options: [
          {
            value: "HOTEL",
            label: "Hotel",
          },
          {
            value: "GUEST_HOUSE",
            label: "Guest House",
          },
          {
            value: "RESTAURANT",
            label: "Restaurant",
          },
        ],
      },

      {
        id: "field-room-count",
        name: "Room Count",
        code: "ROOM_COUNT",
        dataType: "NUMBER",
        required: true,
        unit: "rooms",
        placeholder: "Enter room count",
      },
    ],
  },
];

// =========================================================
// MOCK TAXPAYERS
// =========================================================

const MOCK_TAXPAYERS: Taxpayer[] = [
  {
    id: "taxpayer-001",
    name: "Abebe Kebede",
    phone: "09********",
    address: "Adama, Kebele 01",
  },
  {
    id: "taxpayer-002",
    name: "Hawa Mohammed",
    phone: "09********",
    address: "Adama, Kebele 03",
  },
  {
    id: "taxpayer-003",
    name: "Tadesse Trading",
    phone: "09********",
    address: "Adama, Kebele 04",
  },
  {
    id: "taxpayer-004",
    name: "Fatuma Ali",
    phone: "09********",
    address: "Adama, Kebele 05",
  },
  {
    id: "taxpayer-005",
    name: "Biftu Hotel",
    phone: "09********",
    address: "Adama, Kebele 08",
  },
];

// =========================================================
// MOCK COLLECTION QUEUE
// =========================================================

const MOCK_COLLECTIONS: CollectionRecord[] = [
  {
    id: "fc-001",
    invoiceNumber: "INV-2026-000124",

    taxpayerId: "taxpayer-001",
    taxpayerName: "Abebe Kebede",
    taxpayerPhone: "09********",

    serviceId: "service-cleanliness",
    serviceName: "Cleanliness Service Fee",
    revenueDomain: "SERVICE",

    tariffCode: "19.2",
    tariffName: "Commercial Houses",
    tariffUnit: "Unit",
    tariffRate: 60,
    quantity: 5,

    amount: 300,
    paidAmount: 0,
    balance: 300,

    dueDate: "2026-09-12",
    status: "PENDING",
    createdAt: "2026-09-11",
  },

  {
    id: "fc-002",
    invoiceNumber: "INV-2026-000125",

    taxpayerId: "taxpayer-002",
    taxpayerName: "Hawa Mohammed",
    taxpayerPhone: "09********",

    serviceId: "service-cleanliness",
    serviceName: "Cleanliness Service Fee",
    revenueDomain: "SERVICE",

    tariffCode: "19.1",
    tariffName: "Residential House",
    tariffUnit: "Unit",
    tariffRate: 50,
    quantity: 10,

    amount: 500,
    paidAmount: 200,
    balance: 300,

    dueDate: "2026-09-12",
    status: "PARTIALLY_PAID",
    createdAt: "2026-09-10",
  },

  {
    id: "fc-003",
    invoiceNumber: "INV-2026-000126",

    taxpayerId: "taxpayer-003",
    taxpayerName: "Tadesse Trading",
    taxpayerPhone: "09********",

    serviceId: "service-cleanliness",
    serviceName: "Cleanliness Service Fee",
    revenueDomain: "SERVICE",

    tariffCode: "19.2",
    tariffName: "Commercial Houses",
    tariffUnit: "Unit",
    tariffRate: 60,
    quantity: 15,

    amount: 900,
    paidAmount: 900,
    balance: 0,

    dueDate: "2026-09-11",
    status: "COLLECTED",
    createdAt: "2026-09-09",
  },

  {
    id: "fc-004",
    invoiceNumber: "INV-2026-000127",

    taxpayerId: "taxpayer-004",
    taxpayerName: "Fatuma Ali",
    taxpayerPhone: "09********",

    serviceId: "service-cleanliness",
    serviceName: "Cleanliness Service Fee",
    revenueDomain: "SERVICE",

    tariffCode: "19.1",
    tariffName: "Residential House",
    tariffUnit: "Unit",
    tariffRate: 50,
    quantity: 13,

    amount: 650,
    paidAmount: 0,
    balance: 650,

    dueDate: "2026-09-10",
    status: "PENDING",
    createdAt: "2026-09-09",
  },

  {
    id: "fc-005",
    invoiceNumber: "INV-2026-000128",

    taxpayerId: "taxpayer-005",
    taxpayerName: "Biftu Hotel",
    taxpayerPhone: "09********",

    serviceId: "service-hospitality",
    serviceName: "Hospitality Service Fee",
    revenueDomain: "SERVICE",

    tariffCode: "22.4",
    tariffName: "Hotel",
    tariffUnit: "Room",
    tariffRate: 60,
    quantity: 20,

    amount: 1200,
    paidAmount: 500,
    balance: 700,

    dueDate: "2026-09-08",
    status: "PARTIALLY_PAID",
    createdAt: "2026-09-07",
  },
];

// =========================================================
// HELPERS
// =========================================================

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-ET", {
    style: "currency",
    currency: "ETB",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getStatusLabel(status: CollectionStatus) {
  switch (status) {
    case "PENDING":
      return "Pending";

    case "PARTIALLY_PAID":
      return "Partially Paid";

    case "COLLECTED":
      return "Collected";

    case "CANCELLED":
      return "Cancelled";

    default:
      return status;
  }
}

function getStatusClassName(status: CollectionStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-500/10 text-amber-700 border-amber-500/20";

    case "PARTIALLY_PAID":
      return "bg-blue-500/10 text-blue-700 border-blue-500/20";

    case "COLLECTED":
      return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";

    case "CANCELLED":
      return "bg-red-500/10 text-red-700 border-red-500/20";

    default:
      return "";
  }
}

// =========================================================
// BASE FIELD VALUE INPUT
// =========================================================

type BaseFieldValueInputProps = {
  field: ServiceBaseField;
  value: string;
  onChange: (value: string) => void;
};

function BaseFieldValueInput({
  field,
  value,
  onChange,
}: BaseFieldValueInputProps) {
  switch (field.dataType) {
    case "SELECT":
    case "RADIO":
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue
              placeholder={`Select ${field.name.toLowerCase()}`}
            />
          </SelectTrigger>

          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "NUMBER":
    case "DECIMAL":
      return (
        <div className="relative">
          <Input
            type="number"
            min="0"
            step={field.dataType === "DECIMAL" ? "0.01" : "1"}
            value={value}
            onChange={(event) =>
              onChange(event.target.value)
            }
            placeholder={field.placeholder}
            className={field.unit ? "pr-14" : undefined}
          />

          {field.unit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {field.unit}
            </span>
          )}
        </div>
      );

    case "BOOLEAN":
      return (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select value" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="true">
              Yes
            </SelectItem>

            <SelectItem value="false">
              No
            </SelectItem>
          </SelectContent>
        </Select>
      );

    case "CHECKBOX":
      return (
        <Input
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder="Enter selected values"
        />
      );

    case "DATE":
      return (
        <Input
          type="date"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
      );

    case "FILE":
      return (
        <Input
          type="file"
          onChange={(event) =>
            onChange(
              event.target.files?.[0]?.name ?? ""
            )
          }
        />
      );

    case "TEXT":
    default:
      return (
        <Input
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={
            field.placeholder ??
            `Enter ${field.name.toLowerCase()}`
          }
        />
      );
  }
}

// =========================================================
// PAGE
// =========================================================

export default function FieldCollectionPage() {
  // =======================================================
  // QUEUE FILTERS
  // =======================================================

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");

  // =======================================================
  // UPDATE DIALOG
  // =======================================================

  const [updateDialogOpen, setUpdateDialogOpen] =
    useState(false);

  const [selectedUpdateCollection, setSelectedUpdateCollection] =
    useState<CollectionRecord | null>(null);

  // =======================================================
  // VIEW DETAILS DIALOG
  // =======================================================

  const [detailsDialogOpen, setDetailsDialogOpen] =
    useState(false);

  const [selectedDetailsCollection, setSelectedDetailsCollection] =
    useState<CollectionRecord | null>(null);

  // =======================================================
  // CASH COLLECTION DIALOG
  // =======================================================

  const [cashDialogOpen, setCashDialogOpen] =
    useState(false);

  const [selectedCashCollection, setSelectedCashCollection] =
    useState<CollectionRecord | null>(null);

  const [cashAmount, setCashAmount] =
    useState("");

  const [cashSubmitting, setCashSubmitting] =
    useState(false);

  // =======================================================
  // UPDATE FORM
  // =======================================================

  const [selectedServiceId, setSelectedServiceId] =
    useState("");

  const [selectedTaxpayerId, setSelectedTaxpayerId] =
    useState("");

  const [baseFieldValues, setBaseFieldValues] =
    useState<Record<string, string>>({});

  const [serverResult, setServerResult] =
    useState<ServerCollectionResult | null>(null);

  // =======================================================
  // SELECTED SERVICE
  // =======================================================

  const selectedService = useMemo(() => {
    return (
      MOCK_REVENUE_SERVICES.find(
        (service) =>
          service.id === selectedServiceId
      ) ?? null
    );
  }, [selectedServiceId]);

  // =======================================================
  // SELECTED TAXPAYER
  // =======================================================

  const selectedTaxpayer = useMemo(() => {
    return (
      MOCK_TAXPAYERS.find(
        (taxpayer) =>
          taxpayer.id === selectedTaxpayerId
      ) ?? null
    );
  }, [selectedTaxpayerId]);

  // =======================================================
  // REQUIRED FIELD VALIDATION
  // =======================================================

  const requiredFieldsComplete = useMemo(() => {
    if (!selectedService) {
      return false;
    }

    return selectedService.baseFields.every(
      (field) => {
        if (!field.required) {
          return true;
        }

        const value =
          baseFieldValues[field.id];

        return (
          value !== undefined &&
          value.trim() !== ""
        );
      }
    );
  }, [
    selectedService,
    baseFieldValues,
  ]);

  // =======================================================
  // QUEUE FILTERING
  // =======================================================

  const filteredCollections = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return MOCK_COLLECTIONS.filter((item) => {
      const matchesSearch =
        normalizedSearch === "" ||
        item.invoiceNumber
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.taxpayerName
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.serviceName
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.tariffCode
          .toLowerCase()
          .includes(normalizedSearch) ||
        item.tariffName
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    search,
    statusFilter,
  ]);

  // =======================================================
  // SUMMARY
  // =======================================================

  const summary = useMemo(() => {
    const pending =
      MOCK_COLLECTIONS.filter(
        (item) =>
          item.status === "PENDING"
      ).length;

    const partial =
      MOCK_COLLECTIONS.filter(
        (item) =>
          item.status ===
          "PARTIALLY_PAID"
      ).length;

    const collected =
      MOCK_COLLECTIONS.filter(
        (item) =>
          item.status === "COLLECTED"
      ).length;

    const outstanding =
      MOCK_COLLECTIONS.reduce(
        (total, item) =>
          total + item.balance,
        0
      );

    return {
      pending,
      partial,
      collected,
      outstanding,
    };
  }, []);

  // =======================================================
  // RESET UPDATE FORM
  // =======================================================

  function resetUpdateForm() {
    setSelectedServiceId("");
    setSelectedTaxpayerId("");
    setBaseFieldValues({});
    setServerResult(null);
    setSelectedUpdateCollection(null);
  }

  // =======================================================
  // OPEN UPDATE
  //
  // Update is for updating the collection information,
  // not changing the financial amount directly.
  //
  // Financial values remain server-owned.
  // =======================================================

  function openUpdate(
    collection: CollectionRecord
  ) {
    resetUpdateForm();

    setSelectedUpdateCollection(
      collection
    );

    setSelectedServiceId(
      collection.serviceId
    );

    setSelectedTaxpayerId(
      collection.taxpayerId
    );

    const service =
      MOCK_REVENUE_SERVICES.find(
        (item) =>
          item.id ===
          collection.serviceId
      );

    const initialValues: Record<
      string,
      string
    > = {};

    service?.baseFields.forEach(
      (field) => {
        if (
          field.code ===
          "CUSTOMER"
        ) {
          if (
            collection.tariffCode ===
            "19.1"
          ) {
            initialValues[field.id] =
              "MANA_JIREENYAA";
          } else {
            initialValues[field.id] =
              "DALDALAA";
          }
        }

        if (
          field.code ===
            "QUANTITY" ||
          field.code ===
            "STALL_COUNT" ||
          field.code ===
            "ROOM_COUNT"
        ) {
          initialValues[field.id] =
            String(
              collection.quantity
            );
        }
      }
    );

    setBaseFieldValues(
      initialValues
    );

    setUpdateDialogOpen(true);
  }

  // =======================================================
  // OPEN VIEW DETAILS
  // =======================================================

  function openViewDetails(
    collection: CollectionRecord
  ) {
    setSelectedDetailsCollection(
      collection
    );

    setDetailsDialogOpen(true);
  }

  // =======================================================
  // OPEN COLLECT CASH
  //
  // This action collects against an EXISTING invoice.
  //
  // It does not:
  //
  // - resolve tariff
  // - recalculate invoice
  // - create invoice
  // - modify tariff
  // - modify penalty
  // - modify discount
  //
  // Laravel owns the authoritative balance.
  // =======================================================

  function openCollectCash(
    collection: CollectionRecord
  ) {
    if (collection.balance <= 0) {
      return;
    }

    setSelectedCashCollection(
      collection
    );

    setCashAmount("");

    setCashDialogOpen(true);
  }

  // =======================================================
  // SERVICE CHANGE
  // =======================================================

  function handleServiceChange(
    serviceId: string
  ) {
    setSelectedServiceId(
      serviceId
    );

    setBaseFieldValues({});

    setServerResult(null);
  }

  // =======================================================
  // TAXPAYER CHANGE
  // =======================================================

  function handleTaxpayerChange(
    taxpayerId: string
  ) {
    setSelectedTaxpayerId(
      taxpayerId
    );

    setServerResult(null);
  }

  // =======================================================
  // BASE FIELD CHANGE
  // =======================================================

  function handleBaseFieldChange(
    fieldId: string,
    value: string
  ) {
    setBaseFieldValues(
      (previous) => ({
        ...previous,
        [fieldId]: value,
      })
    );

    setServerResult(null);
  }

  // =======================================================
  // UPDATE COLLECTION
  //
  // Production:
  //
  // PATCH /api/v1/collections/{collection}
  //
  // Financial values MUST NOT come from the frontend.
  // =======================================================

  async function updateCollection() {
    if (
      !selectedUpdateCollection ||
      !selectedService ||
      !selectedTaxpayer
    ) {
      return;
    }

    if (!requiredFieldsComplete) {
      return;
    }

    /*
     * Production example:
     *
     * const response = await api.patch(
     *   `/api/v1/collections/${selectedUpdateCollection.id}`,
     *   {
     *     service_id: selectedService.id,
     *     taxpayer_id: selectedTaxpayer.id,
     *     base_field_values: baseFieldValues,
     *   }
     * );
     *
     * setServerResult(response.data.data);
     */

    const mockServerResponse: ServerCollectionResult = {
      invoice: {
        id:
          selectedUpdateCollection.id,

        invoiceNumber:
          selectedUpdateCollection.invoiceNumber,

        status:
          selectedUpdateCollection.status,

        subtotal:
          selectedUpdateCollection.amount,

        penaltyAmount: 0,

        discountAmount: 0,

        totalAmount:
          selectedUpdateCollection.amount,

        paidAmount:
          selectedUpdateCollection.paidAmount,

        balanceDue:
          selectedUpdateCollection.balance,
      },

      tariff: {
        code:
          selectedUpdateCollection.tariffCode,

        name:
          selectedUpdateCollection.tariffName,

        rate:
          selectedUpdateCollection.tariffRate,

        unit:
          selectedUpdateCollection.tariffUnit,
      },
    };

    setServerResult(
      mockServerResponse
    );
  }

  // =======================================================
  // COLLECT CASH
  //
  // IMPORTANT:
  //
  // The frontend only submits the requested cash amount.
  //
  // Laravel MUST:
  //
  // 1. Authenticate collector.
  // 2. Authorize collection.
  // 3. Lock invoice.
  // 4. Re-read balance_due.
  // 5. Validate amount > 0.
  // 6. Validate amount <= current balance.
  // 7. Create payment record.
  // 8. Update paid_amount.
  // 9. Update balance_due.
  // 10. Update invoice status.
  // 11. Generate receipt.
  // 12. Commit transaction.
  //
  // The displayed balance is informational only.
  // =======================================================

  async function collectCash() {
    if (
      !selectedCashCollection
    ) {
      return;
    }

    const amount =
      Number(cashAmount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return;
    }

    if (
      amount >
      selectedCashCollection.balance
    ) {
      return;
    }

    setCashSubmitting(true);

    try {
      /*
       * Production:
       *
       * const response = await api.post(
       *   `/api/v1/invoices/${selectedCashCollection.id}/payments`,
       *   {
       *     amount,
       *     payment_method: "CASH",
       *   }
       * );
       *
       * The backend should return the updated invoice
       * and receipt information.
       */

      await new Promise(
        (resolve) =>
          setTimeout(resolve, 600)
      );

      const remaining =
        selectedCashCollection.balance -
        amount;

      const updatedStatus =
        remaining <= 0
          ? "COLLECTED"
          : "PARTIALLY_PAID";

      setSelectedCashCollection({
        ...selectedCashCollection,
        paidAmount:
          selectedCashCollection.paidAmount +
          amount,
        balance: remaining,
        status: updatedStatus,
      });

      setCashDialogOpen(false);
      setCashAmount("");
    } finally {
      setCashSubmitting(false);
    }
  }

  // =======================================================
  // CLOSE UPDATE DIALOG
  // =======================================================

  function closeUpdateDialog() {
    setUpdateDialogOpen(false);
    resetUpdateForm();
  }

  // =======================================================
  // CLOSE DETAILS DIALOG
  // =======================================================

  function closeDetailsDialog() {
    setDetailsDialogOpen(false);
    setSelectedDetailsCollection(null);
  }

  // =======================================================
  // CLOSE CASH DIALOG
  // =======================================================

  function closeCashDialog() {
    if (cashSubmitting) {
      return;
    }

    setCashDialogOpen(false);
    setSelectedCashCollection(null);
    setCashAmount("");
  }

  // =======================================================
  // UPDATE SUBMIT STATE
  // =======================================================

  const canUpdate =
    Boolean(selectedService) &&
    Boolean(selectedTaxpayer) &&
    requiredFieldsComplete;

  // =======================================================
  // UI
  // =======================================================

  return (
    <div className="space-y-6 p-6">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <div className="flex items-center gap-2">

            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="size-5 text-primary" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Field Collection
            </h1>

          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage field collections and collect outstanding
            invoice balances.
          </p>
        </div>

        <Button
          className="gap-2"
          onClick={() => {
            resetUpdateForm();
            setUpdateDialogOpen(true);
          }}
        >
          <Wallet className="size-4" />
          Start Collection
        </Button>

      </div>

      {/* ===================================================
          SUMMARY
      =================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <Card>
          <CardContent className="p-5">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-muted-foreground">
                  Pending Collection
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {summary.pending}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Requires collection
                </p>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10">
                <Wallet className="size-4 text-amber-600" />
              </div>

            </div>

          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-muted-foreground">
                  Partially Paid
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {summary.partial}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Remaining balances
                </p>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10">
                <FileText className="size-4 text-blue-600" />
              </div>

            </div>

          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-muted-foreground">
                  Collected
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {summary.collected}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Completed collections
                </p>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>

            </div>

          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm text-muted-foreground">
                  Outstanding
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {formatCurrency(
                    summary.outstanding
                  )}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Remaining to collect
                </p>
              </div>

              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="size-4 text-primary" />
              </div>

            </div>

          </CardContent>
        </Card>

      </div>

      {/* ===================================================
          COLLECTION QUEUE
      =================================================== */}

      <Card>

        <CardHeader className="border-b">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <CardTitle className="text-base">
                Collection Queue
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Existing invoices with collection information.
              </p>
            </div>

            <span className="text-sm text-muted-foreground">
              {filteredCollections.length} records
            </span>

          </div>

        </CardHeader>

        <CardContent className="p-0">

          {/* FILTERS */}

          <div className="flex flex-col gap-3 border-b p-4 lg:flex-row">

            <div className="relative flex-1">

              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search taxpayer, invoice or tariff..."
                className="pl-9"
              />

            </div>

            <Select
              value={statusFilter}
              onValueChange={
                setStatusFilter
              }
            >

              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>

                <SelectItem value="ALL">
                  All statuses
                </SelectItem>

                <SelectItem value="PENDING">
                  Pending
                </SelectItem>

                <SelectItem value="PARTIALLY_PAID">
                  Partially paid
                </SelectItem>

                <SelectItem value="COLLECTED">
                  Collected
                </SelectItem>

                <SelectItem value="CANCELLED">
                  Cancelled
                </SelectItem>

              </SelectContent>

            </Select>

          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">

            <Table>

              <TableHeader>

                <TableRow>

                  <TableHead>
                    Invoice
                  </TableHead>

                  <TableHead>
                    Taxpayer
                  </TableHead>

                  <TableHead>
                    Service / Tariff
                  </TableHead>

                  <TableHead className="text-right">
                    Amount
                  </TableHead>

                  <TableHead className="text-right">
                    Balance
                  </TableHead>

                  <TableHead>
                    Status
                  </TableHead>

                  <TableHead className="w-[50px]" />

                </TableRow>

              </TableHeader>

              <TableBody>

                {filteredCollections.length ===
                0 ? (

                  <TableRow>

                    <TableCell
                      colSpan={7}
                      className="h-32 text-center"
                    >

                      <div className="flex flex-col items-center gap-2">

                        <Search className="size-5 text-muted-foreground" />

                        <p className="text-sm font-medium">
                          No collections found
                        </p>

                        <p className="text-xs text-muted-foreground">
                          Try changing your filters.
                        </p>

                      </div>

                    </TableCell>

                  </TableRow>

                ) : (

                  filteredCollections.map(
                    (collection) => (

                      <TableRow
                        key={
                          collection.id
                        }
                      >

                        {/* INVOICE */}

                        <TableCell>

                          <div className="flex items-center gap-2">

                            <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                              <FileText className="size-4 text-muted-foreground" />
                            </div>

                            <div>

                              <p className="font-medium">
                                {
                                  collection.invoiceNumber
                                }
                              </p>

                              <p className="text-xs text-muted-foreground">
                                {
                                  collection.createdAt
                                }
                              </p>

                            </div>

                          </div>

                        </TableCell>

                        {/* TAXPAYER */}

                        <TableCell>

                          <div>

                            <p className="font-medium">
                              {
                                collection.taxpayerName
                              }
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {
                                collection.taxpayerPhone
                              }
                            </p>

                          </div>

                        </TableCell>

                        {/* SERVICE / TARIFF */}

                        <TableCell>

                          <div>

                            <p className="font-medium">
                              {
                                collection.serviceName
                              }
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-1.5">

                              <Badge
                                variant="outline"
                                className="font-mono text-[10px]"
                              >
                                {
                                  collection.tariffCode
                                }
                              </Badge>

                              <span className="text-xs text-muted-foreground">
                                {
                                  collection.tariffName
                                }
                              </span>

                            </div>

                          </div>

                        </TableCell>

                        {/* AMOUNT */}

                        <TableCell className="text-right">

                          <span className="font-medium">
                            {formatCurrency(
                              collection.amount
                            )}
                          </span>

                        </TableCell>

                        {/* BALANCE */}

                        <TableCell className="text-right">

                          <span
                            className={
                              collection.balance >
                              0
                                ? "font-semibold"
                                : "text-muted-foreground"
                            }
                          >
                            {formatCurrency(
                              collection.balance
                            )}
                          </span>

                        </TableCell>

                        {/* STATUS */}

                        <TableCell>

                          <Badge
                            variant="outline"
                            className={getStatusClassName(
                              collection.status
                            )}
                          >
                            {getStatusLabel(
                              collection.status
                            )}
                          </Badge>

                        </TableCell>

                        {/* ACTIONS */}

                        <TableCell>

                          <DropdownMenu>

                            <DropdownMenuTrigger
                              asChild
                            >

                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                aria-label="Collection actions"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>

                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-44"
                            >

                              {/* ==========================
                                  UPDATE
                              =========================== */}

                              <DropdownMenuItem
                                onClick={() =>
                                  openUpdate(
                                    collection
                                  )
                                }
                              >
                                <Pencil className="mr-2 size-4" />
                                Update
                              </DropdownMenuItem>

                              {/* ==========================
                                  VIEW DETAILS
                              =========================== */}

                              <DropdownMenuItem
                                onClick={() =>
                                  openViewDetails(
                                    collection
                                  )
                                }
                              >
                                <FileText className="mr-2 size-4" />
                                View Details
                              </DropdownMenuItem>

                              {/* ==========================
                                  COLLECT CASH
                              =========================== */}

                              {collection.balance >
                                0 && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    openCollectCash(
                                      collection
                                    )
                                  }
                                >
                                  <Wallet className="mr-2 size-4" />
                                  Collect Cash
                                </DropdownMenuItem>
                              )}

                            </DropdownMenuContent>

                          </DropdownMenu>

                        </TableCell>

                      </TableRow>

                    )
                  )

                )}

              </TableBody>

            </Table>

          </div>

        </CardContent>

      </Card>

      {/* ===================================================
          UPDATE DIALOG
      =================================================== */}

      <Dialog
        open={updateDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeUpdateDialog();
          }
        }}
      >

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">

          <DialogHeader>

            <DialogTitle>
              {selectedUpdateCollection
                ? "Update Collection"
                : "Start Collection"}
            </DialogTitle>

            <DialogDescription>
              {selectedUpdateCollection
                ? "Update the collection information. Financial values are calculated and controlled by the server."
                : "Select the taxpayer and revenue service, then provide the required service information."}
            </DialogDescription>

          </DialogHeader>

          <div className="space-y-5">

            {/* SERVER RESULT */}

            {serverResult && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-4">

                <div className="flex items-start gap-3">

                  <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                    <CheckCircle2 className="size-5 text-emerald-600" />
                  </div>

                  <div className="min-w-0 flex-1">

                    <p className="font-semibold">
                      Collection updated successfully
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      The server has processed the collection
                      information.
                    </p>

                  </div>

                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">

                  <div className="rounded-lg border bg-background p-3">

                    <p className="text-xs text-muted-foreground">
                      Invoice
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold">
                      {
                        serverResult.invoice
                          .invoiceNumber
                      }
                    </p>

                  </div>

                  <div className="rounded-lg border bg-background p-3">

                    <p className="text-xs text-muted-foreground">
                      Total Amount
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {formatCurrency(
                        serverResult.invoice
                          .totalAmount
                      )}
                    </p>

                  </div>

                  <div className="rounded-lg border bg-background p-3">

                    <p className="text-xs text-muted-foreground">
                      Balance Due
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {formatCurrency(
                        serverResult.invoice
                          .balanceDue
                      )}
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* TAXPAYER */}

            <div className="space-y-2">

              <label className="text-sm font-medium">
                Taxpayer
              </label>

              <Select
                value={selectedTaxpayerId}
                onValueChange={
                  handleTaxpayerChange
                }
                disabled={Boolean(serverResult)}
              >

                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select taxpayer" />
                </SelectTrigger>

                <SelectContent>

                  {MOCK_TAXPAYERS.map(
                    (taxpayer) => (

                      <SelectItem
                        key={taxpayer.id}
                        value={taxpayer.id}
                      >

                        <div className="flex flex-col">

                          <span>
                            {
                              taxpayer.name
                            }
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {
                              taxpayer.phone
                            }
                            {" · "}
                            {
                              taxpayer.address
                            }
                          </span>

                        </div>

                      </SelectItem>

                    )
                  )}

                </SelectContent>

              </Select>

            </div>

            {/* TAXPAYER DETAILS */}

            {selectedTaxpayer && (
              <div className="rounded-lg border bg-muted/30 p-4">

                <div className="flex items-start gap-3">

                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <User className="size-4 text-primary" />
                  </div>

                  <div>

                    <p className="font-semibold">
                      {
                        selectedTaxpayer.name
                      }
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {
                        selectedTaxpayer.phone
                      }
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {
                        selectedTaxpayer.address
                      }
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* SERVICE */}

            <div className="space-y-2">

              <label className="text-sm font-medium">
                Revenue Service
              </label>

              <Select
                value={selectedServiceId}
                onValueChange={
                  handleServiceChange
                }
                disabled={Boolean(serverResult)}
              >

                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select revenue service" />
                </SelectTrigger>

                <SelectContent>

                  {MOCK_REVENUE_SERVICES
                    .filter(
                      (service) =>
                        service.collectionMode ===
                          "COLLECTION_ONLY" ||
                        service.collectionMode ===
                          "ASSESSMENT_AND_COLLECTION"
                    )
                    .map(
                      (service) => (

                        <SelectItem
                          key={service.id}
                          value={service.id}
                        >

                          <div className="flex items-center gap-2">

                            <span>
                              {
                                service.name
                              }
                            </span>

                            <span className="text-xs text-muted-foreground">
                              {
                                service.revenueDomain
                              }
                            </span>

                          </div>

                        </SelectItem>

                      )
                    )}

                </SelectContent>

              </Select>

            </div>

            {/* SERVICE BASE FIELDS */}

            {selectedService && (
              <div className="rounded-lg border">

                <div className="border-b px-4 py-3">

                  <div className="flex items-center gap-2">

                    <Tag className="size-4 text-primary" />

                    <div>

                      <p className="text-sm font-semibold">
                        Service Information
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {
                          selectedService.name
                        }
                      </p>

                    </div>

                  </div>

                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-2">

                  {selectedService.baseFields.map(
                    (field) => {

                      const value =
                        baseFieldValues[
                          field.id
                        ] ?? "";

                      const isFilled =
                        value.trim() !== "";

                      return (
                        <div
                          key={field.id}
                          className="space-y-2"
                        >

                          <label className="flex items-center gap-1.5 text-sm font-medium">

                            {field.name}

                            {field.required && (
                              <span className="text-destructive">
                                *
                              </span>
                            )}

                            {isFilled && (
                              <Check className="size-3.5 text-emerald-600" />
                            )}

                          </label>

                          <BaseFieldValueInput
                            field={field}
                            value={value}
                            onChange={(
                              newValue
                            ) =>
                              handleBaseFieldChange(
                                field.id,
                                newValue
                              )
                            }
                          />

                          <p className="text-[11px] text-muted-foreground">
                            {
                              field.code
                            }

                            {field.unit
                              ? ` · ${field.unit}`
                              : ""}
                          </p>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>
            )}

            {/* EXISTING INVOICE */}

            {selectedUpdateCollection && (
              <div className="rounded-lg border">

                <div className="border-b px-4 py-3">

                  <div className="flex items-center gap-2">

                    <FileText className="size-4 text-primary" />

                    <div>

                      <p className="text-sm font-semibold">
                        Existing Invoice
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {
                          selectedUpdateCollection.invoiceNumber
                        }
                      </p>

                    </div>

                  </div>

                </div>

                <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">

                  <div className="rounded-lg border p-3">

                    <p className="text-xs text-muted-foreground">
                      Invoice Amount
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedUpdateCollection.amount
                      )}
                    </p>

                  </div>

                  <div className="rounded-lg border p-3">

                    <p className="text-xs text-muted-foreground">
                      Paid
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedUpdateCollection.paidAmount
                      )}
                    </p>

                  </div>

                  <div className="rounded-lg border p-3">

                    <p className="text-xs text-muted-foreground">
                      Outstanding
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedUpdateCollection.balance
                      )}
                    </p>

                  </div>

                  <div className="rounded-lg border p-3">

                    <p className="text-xs text-muted-foreground">
                      Due Date
                    </p>

                    <p className="mt-1 font-semibold">
                      {
                        selectedUpdateCollection.dueDate
                      }
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* SERVER RESPONSIBILITY */}

            {selectedService &&
              requiredFieldsComplete &&
              !serverResult && (
                <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4">

                  <div className="flex items-start gap-3">

                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Info className="size-4 text-primary" />
                    </div>

                    <div>

                      <p className="text-sm font-semibold">
                        Server-controlled calculation
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Tariff resolution, amount calculation,
                        penalties, discounts, paid amount and
                        balance are controlled by the backend.
                      </p>

                    </div>

                  </div>

                </div>
              )}

          </div>

          <DialogFooter>

            <Button
              variant="outline"
              onClick={
                closeUpdateDialog
              }
            >
              {serverResult
                ? "Close"
                : "Cancel"}
            </Button>

            {!serverResult && (
              <Button
                disabled={!canUpdate}
                onClick={
                  updateCollection
                }
              >
                <CheckCircle2 className="mr-2 size-4" />
                {selectedUpdateCollection
                  ? "Update"
                  : "Start Collection"}
              </Button>
            )}

          </DialogFooter>

        </DialogContent>

      </Dialog>

      {/* ===================================================
          VIEW DETAILS DIALOG
      =================================================== */}

      <Dialog
        open={detailsDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDetailsDialog();
          }
        }}
      >

        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">

          <DialogHeader>

            <DialogTitle>
              Collection Details
            </DialogTitle>

            <DialogDescription>
              Read-only information about the invoice,
              taxpayer, service and financial obligation.
            </DialogDescription>

          </DialogHeader>

          {selectedDetailsCollection && (
            <div className="space-y-5">

              {/* INVOICE */}

              <div className="rounded-lg border">

                <div className="border-b px-4 py-3">

                  <div className="flex items-center gap-2">

                    <FileText className="size-4 text-primary" />

                    <p className="text-sm font-semibold">
                      Invoice
                    </p>

                  </div>

                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2">

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Invoice Number
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold">
                      {
                        selectedDetailsCollection.invoiceNumber
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Status
                    </p>

                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={getStatusClassName(
                          selectedDetailsCollection.status
                        )}
                      >
                        {getStatusLabel(
                          selectedDetailsCollection.status
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Invoice Amount
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedDetailsCollection.amount
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Paid Amount
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedDetailsCollection.paidAmount
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Balance
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedDetailsCollection.balance
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Due Date
                    </p>

                    <p className="mt-1 font-semibold">
                      {
                        selectedDetailsCollection.dueDate
                      }
                    </p>
                  </div>

                </div>

              </div>

              {/* TAXPAYER */}

              <div className="rounded-lg border">

                <div className="border-b px-4 py-3">

                  <div className="flex items-center gap-2">

                    <User className="size-4 text-primary" />

                    <p className="text-sm font-semibold">
                      Taxpayer
                    </p>

                  </div>

                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2">

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Name
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedDetailsCollection.taxpayerName
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Phone
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedDetailsCollection.taxpayerPhone
                      }
                    </p>
                  </div>

                </div>

              </div>

              {/* SERVICE */}

              <div className="rounded-lg border">

                <div className="border-b px-4 py-3">

                  <div className="flex items-center gap-2">

                    <Tag className="size-4 text-primary" />

                    <p className="text-sm font-semibold">
                      Service
                    </p>

                  </div>

                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2">

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Revenue Service
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedDetailsCollection.serviceName
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Revenue Domain
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedDetailsCollection.revenueDomain
                      }
                    </p>
                  </div>

                </div>

              </div>

              {/* TARIFF */}

              <div className="rounded-lg border">

                <div className="border-b px-4 py-3">

                  <p className="text-sm font-semibold">
                    Tariff
                  </p>

                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-2">

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Code
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold">
                      {
                        selectedDetailsCollection.tariffCode
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Name
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedDetailsCollection.tariffName
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Rate
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedDetailsCollection.tariffRate
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Unit
                    </p>

                    <p className="mt-1 font-medium">
                      {
                        selectedDetailsCollection.tariffUnit
                      }
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">
                      Quantity
                    </p>

                    <p className="mt-1 font-semibold">
                      {
                        selectedDetailsCollection.quantity
                      }
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

          <DialogFooter>

            <Button
              variant="outline"
              onClick={
                closeDetailsDialog
              }
            >
              Close
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

      {/* ===================================================
          COLLECT CASH DIALOG
      =================================================== */}

      <Dialog
        open={cashDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCashDialog();
          }
        }}
      >

        <DialogContent className="sm:max-w-lg">

          <DialogHeader>

            <DialogTitle>
              Collect Cash
            </DialogTitle>

            <DialogDescription>
              Record a cash payment against the existing
              invoice. The server will validate the current
              outstanding balance before recording payment.
            </DialogDescription>

          </DialogHeader>

          {selectedCashCollection && (
            <div className="space-y-5">

              {/* INVOICE */}

              <div className="rounded-lg border">

                <div className="border-b px-4 py-3">

                  <div className="flex items-center gap-2">

                    <FileText className="size-4 text-primary" />

                    <div>

                      <p className="text-sm font-semibold">
                        Invoice
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {
                          selectedCashCollection.invoiceNumber
                        }
                      </p>

                    </div>

                  </div>

                </div>

                <div className="grid gap-3 p-4 sm:grid-cols-3">

                  <div>

                    <p className="text-xs text-muted-foreground">
                      Invoice Amount
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedCashCollection.amount
                      )}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-muted-foreground">
                      Paid
                    </p>

                    <p className="mt-1 font-semibold">
                      {formatCurrency(
                        selectedCashCollection.paidAmount
                      )}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-muted-foreground">
                      Outstanding
                    </p>

                    <p className="mt-1 font-semibold text-primary">
                      {formatCurrency(
                        selectedCashCollection.balance
                      )}
                    </p>

                  </div>

                </div>

              </div>

              {/* TAXPAYER */}

              <div className="rounded-lg border bg-muted/30 p-4">

                <div className="flex items-start gap-3">

                  <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                    <User className="size-4 text-primary" />
                  </div>

                  <div>

                    <p className="font-semibold">
                      {
                        selectedCashCollection.taxpayerName
                      }
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {
                        selectedCashCollection.taxpayerPhone
                      }
                    </p>

                  </div>

                </div>

              </div>

              {/* SERVICE */}

              <div className="rounded-lg border p-4">

                <div className="flex items-center justify-between gap-4">

                  <div>

                    <p className="text-xs text-muted-foreground">
                      Revenue Service
                    </p>

                    <p className="mt-1 text-sm font-semibold">
                      {
                        selectedCashCollection.serviceName
                      }
                    </p>

                  </div>

                  <Badge
                    variant="outline"
                    className="font-mono"
                  >
                    {
                      selectedCashCollection.tariffCode
                    }
                  </Badge>

                </div>

              </div>

              {/* CASH AMOUNT */}

              <div className="space-y-2">

                <label
                  htmlFor="cash-amount"
                  className="text-sm font-medium"
                >
                  Cash Amount
                </label>

                <div className="relative">

                  <Input
                    id="cash-amount"
                    type="number"
                    min="0.01"
                    max={
                      selectedCashCollection.balance
                    }
                    step="0.01"
                    value={cashAmount}
                    onChange={(event) =>
                      setCashAmount(
                        event.target.value
                      )
                    }
                    placeholder="Enter cash amount"
                    className="pr-16 text-lg"
                    disabled={cashSubmitting}
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                    ETB
                  </span>

                </div>

                <p className="text-xs text-muted-foreground">
                  Maximum collectible amount:
                  {" "}
                  {formatCurrency(
                    selectedCashCollection.balance
                  )}
                </p>

              </div>

              {/* SERVER VALIDATION NOTICE */}

              <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-4">

                <div className="flex items-start gap-3">

                  <Info className="mt-0.5 size-4 shrink-0 text-primary" />

                  <div>

                    <p className="text-sm font-medium">
                      Server-controlled payment
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      The displayed balance is informational.
                      The backend will lock the invoice, re-check
                      the current balance, validate the cash amount,
                      record the payment and update the invoice
                      status.
                    </p>

                  </div>

                </div>

              </div>

            </div>
          )}

          <DialogFooter>

            <Button
              variant="outline"
              onClick={
                closeCashDialog
              }
              disabled={
                cashSubmitting
              }
            >
              Cancel
            </Button>

            <Button
              onClick={
                collectCash
              }
              disabled={
                cashSubmitting ||
                !selectedCashCollection ||
                !cashAmount ||
                Number(cashAmount) <= 0 ||
                Number(cashAmount) >
                  (selectedCashCollection?.balance ??
                    0)
              }
            >
              <Wallet className="mr-2 size-4" />

              {cashSubmitting
                ? "Collecting..."
                : "Collect Cash"}
            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>
  );
}