"use client";

import React, { useMemo, useState } from "react";

import {
  Landmark,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Power,
  Search,
  Eye,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import type { BankAccount, BankAccountFilters } from "@/types/revenue/bank-account";
import {
  useActivateBankAccount,
  useBankAccounts,
  useDeactivateBankAccount,
} from "@/hooks/revenue/bankaccount.hook";
import { BankAccountSheet, SheetMode } from "@/components/sheets/bankAccountSheet";
import { CopyAccountNumber } from "@/components/copy-account-number";


type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

// ---------------------------------------------------
// Helpers
// ---------------------------------------------------

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={`gap-1.5 font-medium ${
        isActive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

function BankAvatar({ name, active }: { name: string; active: boolean }) {
  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
      }`}
    >
      {initials(name) || <Landmark className="h-4 w-4" />}
    </div>
  );
}

// ---------------------------------------------------
// Page
// ---------------------------------------------------

function BankAccountsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  // One sheet handles create, edit and view
  const [sheet, setSheet] = useState<{
    open: boolean;
    mode: SheetMode;
    account: BankAccount | null;
  }>({ open: false, mode: "view", account: null });

  const openSheet = (mode: SheetMode, account: BankAccount | null = null) =>
    setSheet({ open: true, mode, account });

  // Fetch by search only, then filter status locally so tab counts stay accurate.
  const queryParams = useMemo<BankAccountFilters>(
    () => ({ search: search.trim() || undefined, per_page: 100 }),
    [search],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useBankAccounts(queryParams);

  const allAccounts: BankAccount[] = data?.data ?? [];

  const activateMutation = useActivateBankAccount();
  const deactivateMutation = useDeactivateBankAccount();
  const isMutating = activateMutation.isPending || deactivateMutation.isPending;

  const activeCount = allAccounts.filter((a) => a.is_active).length;
  const inactiveCount = allAccounts.length - activeCount;

  const accounts = allAccounts.filter((a) =>
    statusFilter === "ALL"
      ? true
      : statusFilter === "ACTIVE"
        ? a.is_active
        : !a.is_active,
  );

  const handleToggleStatus = (account: BankAccount) => {
    if (account.is_active) deactivateMutation.mutate(account.id);
    else activateMutation.mutate(account.id);
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  const hasFilters = !!search || statusFilter !== "ALL";

  const tabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: allAccounts.length },
    { key: "ACTIVE", label: "Active", count: activeCount },
    { key: "INACTIVE", label: "Inactive", count: inactiveCount },
  ];

  // ---------- Loading ----------
  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-32 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading bank accounts...
      </div>
    );
  }

  // ---------- Error ----------
  if (isError && !data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-16 text-center">
            <div className="rounded-full border bg-muted/30 p-3">
              <Landmark className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-semibold">
              Unable to load bank accounts
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Check your connection and try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => refetch()}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Revenue Management / Revenue Configuration
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Bank accounts
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Municipal accounts that taxpayers can pay into. Only active
            accounts are offered for new bank-transfer payments.
          </p>
        </div>

        <Button className="shrink-0" onClick={() => openSheet("create")}>
          <Plus className="mr-2 h-4 w-4" />
          Add bank account
        </Button>
      </div>

      {/* Main panel */}
      <Card className="overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b bg-muted/20 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            role="tablist"
            aria-label="Filter by status"
            className="inline-flex w-full rounded-lg border bg-background p-1 sm:w-auto"
          >
            {tabs.map((tab) => {
              const selected = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  type="button"
                  aria-selected={selected}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
                    selected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      selected ? "bg-primary-foreground/20" : "bg-muted"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {isFetching && !isLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}

            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by bank, name or number"
                className="bg-background pl-9 pr-9"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Empty */}
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-20 text-center">
            <div className="rounded-full border bg-muted/30 p-3">
              <Landmark className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-semibold">
              {hasFilters ? "No matching accounts" : "No bank accounts yet"}
            </h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {hasFilters
                ? "Try a different search or status."
                : "Add the first municipal account to start accepting bank transfers."}
            </p>
            {hasFilters ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={clearFilters}
              >
                Clear filters
              </Button>
            ) : (
              <Button
                size="sm"
                className="mt-4"
                onClick={() => openSheet("create")}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add bank account
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Bank</th>
                  <th className="px-6 py-3 font-medium">Account number</th>
                  <th className="px-6 py-3 font-medium">Currency</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="hidden px-6 py-3 font-medium md:table-cell">
                    Added
                  </th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>

              <tbody>
                {accounts.map((account) => (
                  <tr
                    key={account.id}
                    className={`border-b transition-colors last:border-0 hover:bg-muted/30 ${
                      account.is_active ? "" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => openSheet("view", account)}
                        className="flex items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <BankAvatar
                          name={account.bank_name}
                          active={account.is_active}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {account.bank_name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {account.account_name}
                          </p>
                        </div>
                      </button>
                    </td>

                    <td className="px-4 py-4">
                      <CopyAccountNumber value={account.account_number} />
                    </td>

                    <td className="px-6 py-4">
                      <Badge variant="secondary" className="font-mono">
                        {account.currency}
                      </Badge>
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge isActive={account.is_active} />
                    </td>

                    <td className="hidden px-6 py-4 text-muted-foreground md:table-cell">
                      {formatDate(account.created_at)}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Account actions"
                            disabled={isMutating}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => openSheet("view", account)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View account
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openSheet("edit", account)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit account
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            disabled={isMutating}
                            onClick={() => handleToggleStatus(account)}
                            className={
                              account.is_active
                                ? "text-destructive focus:text-destructive"
                                : ""
                            }
                          >
                            <Power className="mr-2 h-4 w-4" />
                            {account.is_active
                              ? "Deactivate account"
                              : "Activate account"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {accounts.length > 0 && (
          <div className="flex items-center justify-between border-t bg-muted/20 px-6 py-3 text-xs text-muted-foreground">
            <span>
              Showing {accounts.length} of {allAccounts.length} account
              {allAccounts.length === 1 ? "" : "s"}
            </span>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Create / edit / view */}
      <BankAccountSheet
        open={sheet.open}
        mode={sheet.mode}
        account={sheet.account}
        onOpenChange={(open) => setSheet((prev) => ({ ...prev, open }))}
        onModeChange={(mode) => setSheet((prev) => ({ ...prev, mode }))}
      />
    </div>
  );
}

export default BankAccountsPage;