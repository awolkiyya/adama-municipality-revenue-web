"use client";

import {
  ClipboardCheck,
  Clock3,
  FileCheck2,
  ListChecks,
  RotateCcw,
} from "lucide-react";

import type {
  AssessmentConfig,
} from "./assessment.config";


// =====================================================
// TYPES
// =====================================================

type AssessmentSummaryData = {
  draft?: number;
  pending_approval?: number;
  approved?: number;
  returned?: number;
};

type AssessmentSummaryProps = {
  total: number;

  summary:
    | AssessmentSummaryData
    | undefined;

  config:
    AssessmentConfig;
};


// =====================================================
// COMPONENT
// =====================================================

export function AssessmentSummary({
  total,
  summary,
  config,
}: AssessmentSummaryProps) {

  const cards = [
    {
      key: "all",
      label: "All Assessments",
      value: total,
      caption: "Across every status",
      icon: ListChecks,
    },

    {
      key: "draft",
      label: "Drafts",
      value: summary?.draft ?? 0,
      caption: "Not yet submitted",
      icon: ClipboardCheck,
    },

    {
      key: "pending",
      label: "Pending Approval",
      value:
        summary?.pending_approval ??
        0,
      caption:
        "Awaiting revenue decision",
      icon: Clock3,
    },

    {
      key: "approved",
      label: "Approved",
      value:
        summary?.approved ?? 0,
      caption:
        "Successfully approved",
      icon: FileCheck2,
    },

    {
      key: "returned",
      label: "Returned",
      value:
        summary?.returned ?? 0,
      caption:
        "Returned assessments",
      icon: RotateCcw,
    },
  ];

  return (
    <div
      className="
        grid
        gap-4
        sm:grid-cols-2
        lg:grid-cols-5
      "
    >

      {cards.map((card) => {

        const Icon =
          card.icon;

        return (
          <div
            key={card.key}
            className="
              rounded-xl
              border
              bg-card
              p-5
              shadow-sm
              transition
              hover:shadow-md
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
                gap-3
              "
            >

              <div>

                <p
                  className="
                    text-sm
                    font-medium
                    text-muted-foreground
                  "
                >
                  {card.label}
                </p>

                <h3
                  className="
                    mt-2
                    text-3xl
                    font-bold
                  "
                >
                  {card.value}
                </h3>

              </div>

              <div
                className="
                  rounded-lg
                  bg-primary/10
                  p-3
                "
              >

                <Icon
                  className="
                    h-5
                    w-5
                    text-primary
                  "
                />

              </div>

            </div>

            <p
              className="
                mt-4
                text-xs
                text-muted-foreground
              "
            >
              {card.caption}
            </p>

          </div>
        );
      })}

    </div>
  );
}