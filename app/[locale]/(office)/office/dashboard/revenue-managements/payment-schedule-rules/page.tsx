"use client";

import React, { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings2,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  useActivatePaymentScheduleRule,
  useDeactivatePaymentScheduleRule,
  usePaymentScheduleRuleSummary,
  usePaymentScheduleRules,
} from "@/hooks/revenue/use-payment-schedule-rules";

import type {
  PaymentScheduleRuleFilters,
} from "@/types/revenue/payment-schedule-rule";

function PaymentScheduleRulesPage() {
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | FILTER STATE
  |--------------------------------------------------------------------------
  */

  const [search, setSearch] = useState("");

  const [filters, setFilters] =
    useState<PaymentScheduleRuleFilters>({
      page: 1,
      per_page: 10,
    });

  /*
  |--------------------------------------------------------------------------
  | QUERIES
  |--------------------------------------------------------------------------
  */

  const {
    data: rulesResponse,
    isLoading: isRulesLoading,
    isFetching: isRulesFetching,
  } = usePaymentScheduleRules({
    ...filters,
    search: search.trim() || undefined,
  });

  const {
    data: summaryResponse,
    isLoading: isSummaryLoading,
  } = usePaymentScheduleRuleSummary();

  /*
  |--------------------------------------------------------------------------
  | MUTATIONS
  |--------------------------------------------------------------------------
  */

  const activateMutation =
    useActivatePaymentScheduleRule();

  const deactivateMutation =
    useDeactivatePaymentScheduleRule();

  /*
  |--------------------------------------------------------------------------
  | RESPONSE DATA
  |--------------------------------------------------------------------------
  */

  const rules = rulesResponse?.data ?? [];

  const summary = summaryResponse?.data;

  /*
  |--------------------------------------------------------------------------
  | SUMMARY VALUES
  |--------------------------------------------------------------------------
  */

  const totalRules =
    summary?.total ?? 0;

  const enabledCount =
    summary?.active ?? 0;

  const disabledCount =
    summary?.inactive ?? 0;

  const configuredPercentageCount =
    summary?.percentage_configured ?? 0;

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const currentPage =
    rulesResponse?.meta?.current_page ?? 1;

  const lastPage =
    rulesResponse?.meta?.last_page ?? 1;

  const total =
    rulesResponse?.meta?.total ?? rules.length;

  const perPage =
    rulesResponse?.meta?.per_page ?? 10;

  /*
  |--------------------------------------------------------------------------
  | ACTIONS
  |--------------------------------------------------------------------------
  */

  const handleCreate = () => {
    router.push(
      "/office/dashboard/revenue-managements/payment-schedule-rules/create",
    );
  };

  const handleEdit = (id: string) => {
    router.push(
      `/office/dashboard/revenue-managements/payment-schedule-rules/${id}/edit`,
    );
  };

  const handleView = (id: string) => {
    router.push(
      `/office/dashboard/revenue-managements/payment-schedule-rules/${id}`,
    );
  };

  const handleActivate = (id: string) => {
    activateMutation.mutate(id);
  };

  const handleDeactivate = (id: string) => {
    deactivateMutation.mutate(id);
  };

  /*
  |--------------------------------------------------------------------------
  | SEARCH
  |--------------------------------------------------------------------------
  */

  const handleSearchChange = (
    value: string,
  ) => {
    setSearch(value);

    setFilters((current) => ({
      ...current,
      page: 1,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const handlePreviousPage = () => {
    if (currentPage <= 1) {
      return;
    }

    setFilters((current) => ({
      ...current,
      page: currentPage - 1,
    }));
  };

  const handleNextPage = () => {
    if (currentPage >= lastPage) {
      return;
    }

    setFilters((current) => ({
      ...current,
      page: currentPage + 1,
    }));
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const isLoading =
    isRulesLoading ||
    isSummaryLoading;

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <div className="space-y-6 max-w-4xl m-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <CalendarClock className="size-5 text-primary" />
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Payment Schedule Rules
            </h1>
          </div>

          <p className="max-w-2xl text-sm text-muted-foreground">
            Configure payment scheduling rules for revenue
            codes, including first-installment requirements.
          </p>
        </div>

        <Button onClick={handleCreate}>
          <Plus className="mr-2 size-4" />
          Add Rule
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total */}
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Settings2 className="size-5 text-primary" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Total Rules
              </p>

              <p className="text-2xl font-semibold">
                {isLoading ? "—" : totalRules}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Active */}
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle2 className="size-5 text-emerald-600" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Active
              </p>

              <p className="text-2xl font-semibold">
                {isLoading ? "—" : enabledCount}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Inactive */}
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <XCircle className="size-5 text-muted-foreground" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Inactive
              </p>

              <p className="text-2xl font-semibold">
                {isLoading ? "—" : disabledCount}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Configured */}
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <CalendarClock className="size-5 text-blue-600" />
            </div>

            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">
                Percentage Configured
              </p>

              <p className="text-2xl font-semibold">
                {isLoading
                  ? "—"
                  : configuredPercentageCount}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rules Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle>
                Payment Schedule Configuration
              </CardTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                Manage scheduling behavior by revenue code.
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  handleSearchChange(
                    event.target.value,
                  )
                }
                placeholder="Search code or revenue name..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isRulesLoading ? (
            /* Loading State */
            <div className="flex min-h-64 items-center justify-center rounded-lg border">
              <div className="text-sm text-muted-foreground">
                Loading payment schedule rules...
              </div>
            </div>
          ) : rules.length > 0 ? (
            <>
              {/* Table */}
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="border-b text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Revenue Code
                      </th>

                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Revenue Name
                      </th>

                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        First Installment
                      </th>

                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Status
                      </th>

                      <th className="px-4 py-3 font-medium text-muted-foreground">
                        Updated
                      </th>

                      <th className="w-16 px-4 py-3" />
                    </tr>
                  </thead>

                  <tbody>
                    {rules.map((rule) => (
                      <tr
                        key={rule.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        {/* Revenue Code */}
                        <td className="px-4 py-4">
                          <span className="font-mono font-semibold">
                            {rule.revenue_code.code}
                          </span>
                        </td>

                        {/* Revenue Name */}
                        <td className="px-4 py-4">
                          <div className="font-medium">
                            {rule.revenue_code.name}
                          </div>
                        </td>

                        {/* First Installment */}
                        <td className="px-4 py-4">
                          {rule.first_installment_percentage !==
                          null ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {
                                  rule.first_installment_percentage
                                }
                                %
                              </span>

                              <span className="text-xs text-muted-foreground">
                                of principal
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              Not configured
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          {rule.is_enabled ? (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                            >
                              <CheckCircle2 className="mr-1 size-3.5" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="mr-1 size-3.5" />
                              Inactive
                            </Badge>
                          )}
                        </td>

                        {/* Updated */}
                        <td className="px-4 py-4 text-muted-foreground">
                          {rule.updated_at
                            ? new Date(
                                rule.updated_at,
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Actions for ${rule.revenue_code.code}`}
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              {/* View */}
                              <DropdownMenuItem
                                onClick={() =>
                                  handleView(
                                    rule.id,
                                  )
                                }
                              >
                                <Eye className="mr-2 size-4" />
                                View
                              </DropdownMenuItem>

                              {/* Edit */}
                              <DropdownMenuItem
                                onClick={() =>
                                  handleEdit(
                                    rule.id,
                                  )
                                }
                              >
                                <Pencil className="mr-2 size-4" />
                                Edit
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {/* Activate / Deactivate */}
                              {rule.is_enabled ? (
                                <DropdownMenuItem
                                  disabled={
                                    deactivateMutation.isPending
                                  }
                                  onClick={() =>
                                    handleDeactivate(
                                      rule.id,
                                    )
                                  }
                                >
                                  <XCircle className="mr-2 size-4" />
                                  Deactivate
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  disabled={
                                    activateMutation.isPending
                                  }
                                  onClick={() =>
                                    handleActivate(
                                      rule.id,
                                    )
                                  }
                                >
                                  <CheckCircle2 className="mr-2 size-4" />
                                  Activate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer / Pagination */}
              <div className="mt-4 flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-muted-foreground">
                  {isRulesFetching ? (
                    "Refreshing..."
                  ) : (
                    <>
                      Showing{" "}
                      <span className="font-medium text-foreground">
                        {Math.min(
                          (currentPage - 1) *
                            perPage +
                            1,
                          total,
                        )}
                      </span>
                      {" – "}
                      <span className="font-medium text-foreground">
                        {Math.min(
                          currentPage *
                            perPage,
                          total,
                        )}
                      </span>{" "}
                      of{" "}
                      <span className="font-medium text-foreground">
                        {total}
                      </span>{" "}
                      rules
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      currentPage <= 1 ||
                      isRulesFetching
                    }
                    onClick={
                      handlePreviousPage
                    }
                  >
                    Previous
                  </Button>

                  <div className="min-w-20 text-center text-sm text-muted-foreground">
                    Page{" "}
                    <span className="font-medium text-foreground">
                      {currentPage}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">
                      {lastPage}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      currentPage >= lastPage ||
                      isRulesFetching
                    }
                    onClick={handleNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <CalendarClock className="size-6 text-muted-foreground" />
              </div>

              <h3 className="mt-4 font-semibold">
                No payment schedule rules found
              </h3>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {search
                  ? "No rules match your search. Try another revenue code or revenue name."
                  : "Create a payment schedule rule to configure scheduling for a revenue code."}
              </p>

              {!search && (
                <Button
                  className="mt-4"
                  onClick={handleCreate}
                >
                  <Plus className="mr-2 size-4" />
                  Add Rule
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentScheduleRulesPage;