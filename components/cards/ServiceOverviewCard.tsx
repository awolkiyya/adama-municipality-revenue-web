"use client";

import { useState } from "react";

import {
  Layers,
  Hash,
  FolderTree,
  CheckCircle2,
  CircleOff,
  Building2,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

import { cn } from "@/lib/utils";

import type { RevenueService } from "@/types/revenue/revenu-service";

/* =========================================================
   STAT TILE
========================================================= */

type StatTone =
  | "emerald"
  | "slate"
  | "blue"
  | "purple";

const TONE_STYLES: Record<
  StatTone,
  {
    chip: string;
    icon: string;
  }
> = {
  emerald: {
    chip: "bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-400",
  },

  slate: {
    chip: "bg-slate-500/10",
    icon: "text-slate-600 dark:text-slate-400",
  },

  blue: {
    chip: "bg-blue-500/10",
    icon: "text-blue-600 dark:text-blue-400",
  },

  purple: {
    chip: "bg-purple-500/10",
    icon: "text-purple-600 dark:text-purple-400",
  },
};

function StatTile({
  icon,
  label,
  value,
  tone = "slate",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone?: StatTone;
}) {
  const {
    chip,
    icon: iconColor,
  } = TONE_STYLES[tone];

  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
          chip,
          iconColor,
        )}
      >
        {icon}
      </span>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <p className="truncate text-lg font-semibold leading-tight text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   SERVICE OVERVIEW CARD
========================================================= */

interface ServiceOverviewCardProps {
  /*
   * Use the actual API RevenueService type.
   *
   * This is important because the API type allows:
   *
   * revenueCode?: RevenueCode | null
   *
   * instead of assuming revenueCode is always an object.
   */
  service: RevenueService;

  activeCount: number;

  inactiveCount: number;

  sectorsCount: number;

  totalRulesCount: number;

  defaultOpen?: boolean;
}

/* =========================================================
   COMPONENT
========================================================= */

export function ServiceOverviewCard({
  service,
  activeCount,
  inactiveCount,
  sectorsCount,
  totalRulesCount,
  defaultOpen = true,
}: ServiceOverviewCardProps) {
  const [
    open,
    setOpen,
  ] = useState(
    defaultOpen,
  );

  return (
    <Card
      className="
        overflow-hidden
        border-border/60
        bg-gradient-to-br
        from-muted/40
        via-background
        to-background
      "
    >
      <Collapsible
        open={open}
        onOpenChange={setOpen}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <CollapsibleTrigger asChild>
          <CardHeader
            className={cn(
              `
                cursor-pointer
                select-none
                border-b
                border-border/60
                bg-muted/30
                pb-4
                transition-colors
                hover:bg-muted/50
              `,

              !open &&
                "border-b-0",
            )}
          >
            <div
              className="
                flex
                items-center
                justify-between
                gap-3
              "
            >

              {/* SERVICE IDENTITY */}

              <CardTitle
                className="
                  flex
                  items-center
                  gap-2.5
                "
              >
                <span
                  className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-lg
                    bg-primary/10
                    text-primary
                  "
                >
                  <Layers size={16} />
                </span>

                <span>
                  <span
                    className="
                      block
                      text-sm
                      font-semibold
                      text-foreground
                    "
                  >
                    {service.name}
                  </span>

                  <span
                    className="
                      block
                      text-xs
                      font-normal
                      text-muted-foreground
                    "
                  >
                    Service Overview
                  </span>
                </span>
              </CardTitle>


              {/* SUMMARY */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                "
              >

                {/* ACTIVE */}

                <div
                  className="
                    hidden
                    items-center
                    gap-2
                    sm:flex
                  "
                >
                  <span
                    className="
                      flex
                      items-center
                      gap-1
                      rounded-full
                      bg-emerald-500/10
                      px-2.5
                      py-1
                      text-xs
                      font-medium
                      text-emerald-600
                      dark:text-emerald-400
                    "
                  >
                    <CheckCircle2 size={12} />

                    {activeCount} active
                  </span>


                  {/* INACTIVE */}

                  <span
                    className="
                      flex
                      items-center
                      gap-1
                      rounded-full
                      bg-slate-500/10
                      px-2.5
                      py-1
                      text-xs
                      font-medium
                      text-slate-600
                      dark:text-slate-400
                    "
                  >
                    <CircleOff size={12} />

                    {inactiveCount} inactive
                  </span>
                </div>


                {/* CHEVRON */}

                <ChevronDown
                  size={18}
                  className={cn(
                    `
                      shrink-0
                      text-muted-foreground
                      transition-transform
                      duration-200
                    `,

                    open &&
                      "rotate-180",
                  )}
                />

              </div>

            </div>
          </CardHeader>
        </CollapsibleTrigger>


        {/* =================================================
            COLLAPSIBLE CONTENT
        ================================================= */}

        <CollapsibleContent
          className="
            data-[state=closed]:animate-collapsible-up
            data-[state=open]:animate-collapsible-down
            overflow-hidden
          "
        >

          {/* =================================================
              METADATA
          ================================================= */}

          <CardContent
            className="
              grid
              divide-y
              divide-border/60
              border-b
              border-border/60
              p-0
              sm:grid-cols-2
              sm:divide-x
              sm:divide-y-0
            "
          >

            {/* REVENUE CODE */}

            <div
              className="
                flex
                items-center
                gap-3
                px-5
                py-4
              "
            >
              <span
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-md
                  bg-blue-500/10
                  text-blue-600
                  dark:text-blue-400
                "
              >
                <Hash size={16} />
              </span>

              <div className="min-w-0">

                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-muted-foreground
                  "
                >
                  Revenue Code
                </p>

                <p
                  className="
                    truncate
                    font-semibold
                    text-foreground
                  "
                >
                  {service.revenueCode?.code ?? "—"}
                </p>

              </div>
            </div>


            {/* CATEGORY */}

            <div
              className="
                flex
                items-center
                gap-3
                px-5
                py-4
              "
            >
              <span
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-md
                  bg-purple-500/10
                  text-purple-600
                  dark:text-purple-400
                "
              >
                <FolderTree size={16} />
              </span>

              <div className="min-w-0">

                <p
                  className="
                    text-xs
                    font-medium
                    uppercase
                    tracking-wide
                    text-muted-foreground
                  "
                >
                  Category
                </p>

                <p
                  className="
                    truncate
                    font-semibold
                    text-foreground
                  "
                >
                  {service.revenueCode?.name ?? "—"}
                </p>

              </div>
            </div>

          </CardContent>


          {/* =================================================
              STATISTICS
          ================================================= */}

          <CardContent
            className="
              grid
              grid-cols-2
              divide-x
              divide-y
              divide-border/60
              p-0
              md:grid-cols-4
              md:divide-y-0
            "
          >

            <StatTile
              icon={
                <CheckCircle2 size={16} />
              }
              label="Active"
              value={activeCount}
              tone="emerald"
            />

            <StatTile
              icon={
                <CircleOff size={16} />
              }
              label="Inactive"
              value={inactiveCount}
              tone="slate"
            />

            <StatTile
              icon={
                <Building2 size={16} />
              }
              label="Sectors"
              value={sectorsCount}
              tone="blue"
            />

            <StatTile
              icon={
                <ShieldCheck size={16} />
              }
              label="Total Rules"
              value={totalRulesCount}
              tone="purple"
            />

          </CardContent>

        </CollapsibleContent>

      </Collapsible>
    </Card>
  );
}