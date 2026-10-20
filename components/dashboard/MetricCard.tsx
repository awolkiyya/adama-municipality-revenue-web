"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { IconType } from "@/types/dashboard";
 
export default function MetricCard({
    title,
    value,
    helper,
    icon: Icon,
    iconClassName,
    trend,
  }: {
    title: string;
    value: string;
    helper: string;
    icon: IconType;
    iconClassName?: string;
    trend?: number | null;
  }) {
    const hasTrend = typeof trend === "number";
    const isPositive = hasTrend && trend >= 0;
  
    return (
      <Card className="min-w-0 border-none shadow-none">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
  
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-lg",
                iconClassName ?? "bg-muted text-foreground",
              )}
            >
              <Icon className="size-4" />
            </div>
          </div>
  
          <p className="mt-3 break-words text-2xl font-semibold tracking-tight">
            {value}
          </p>
  
          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {hasTrend && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold",
                  isPositive
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400",
                )}
              >
                {isPositive ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}
                {isPositive ? "+" : ""}
                {trend.toFixed(1)}%
              </span>
            )}
  
            <span className="text-muted-foreground">{helper}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  