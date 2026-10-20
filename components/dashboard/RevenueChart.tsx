"use client";

import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ChartType, RevenuePoint } from "@/types/dashboard";

/* -------------------------------------------------------------------------- */
/* Config & formatters                                                        */
/* -------------------------------------------------------------------------- */

const chartConfig = {
  assessment: { label: "Assessment-based", color: "var(--chart-1)" },
  direct: { label: "Direct collection", color: "var(--chart-2)" },
} satisfies ChartConfig;

type SeriesKey = keyof typeof chartConfig;

const etb = new Intl.NumberFormat("en-ET", {
  style: "currency",
  currency: "ETB",
  maximumFractionDigits: 0,
});

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const formatETB = (value: number) => etb.format(value);
const formatAxisValue = (value: number) => compact.format(value);

function formatDate(value: string, long = false): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    ...(long && { year: "numeric" }),
  }).format(date);
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function RevenueChart({
  data,
  chartType,
}: {
  data: RevenuePoint[];
  chartType: ChartType;
}) {
  const hasCollections = data.some((d) => d.assessment > 0 || d.direct > 0);

  if (!hasCollections) {
    return <EmptyState />;
  }

  const shared = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="date"
        tickFormatter={(v: string) => formatDate(v)}
        tickLine={false}
        axisLine={false}
        tickMargin={10}
        minTickGap={24}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tickFormatter={formatAxisValue}
        width={44}
        allowDecimals={false}
      />
      <ChartTooltip
        cursor={
          chartType === "bar" ? { fill: "var(--muted)", opacity: 0.4 } : true
        }
        content={
          <ChartTooltipContent
            labelFormatter={(value) => formatDate(String(value), true)}
            formatter={(value, name, item) => {
              const key = name as SeriesKey;
              const { assessment = 0, direct = 0 } = item.payload as RevenuePoint;
              const isLast = key === "direct";

              return (
                <>
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: `var(--color-${key})` }}
                  />
                  <span className="text-muted-foreground">
                    {chartConfig[key]?.label ?? name}
                  </span>
                  <span className="ml-auto font-medium tabular-nums">
                    {formatETB(Number(value))}
                  </span>

                  {isLast && (
                    <div className="mt-1.5 flex basis-full items-center border-t pt-1.5 font-medium">
                      Total
                      <span className="ml-auto tabular-nums">
                        {formatETB(assessment + direct)}
                      </span>
                    </div>
                  )}
                </>
              );
            }}
          />
        }
      />
      <ChartLegend content={<ChartLegendContent />} />
    </>
  );

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[260px] w-full sm:h-[300px]"
    >
      {chartType === "bar" ? (
        <BarChart accessibilityLayer data={data}>
          {shared}
          <Bar
            dataKey="assessment"
            fill="var(--color-assessment)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
          <Bar
            dataKey="direct"
            fill="var(--color-direct)"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
            isAnimationActive={false}
          />
        </BarChart>
      ) : (
        <LineChart accessibilityLayer data={data}>
          {shared}
          <Line
            dataKey="assessment"
            type="monotone"
            stroke="var(--color-assessment)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            dataKey="direct"
            type="monotone"
            stroke="var(--color-direct)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      )}
    </ChartContainer>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyState() {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center rounded-lg border border-dashed px-6 text-center sm:h-[300px]">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
        <BarChart3 className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No collections in this period</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Try a different date range to see collection activity.
      </p>
    </div>
  );
}