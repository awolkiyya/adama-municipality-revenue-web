"use client";

// =====================================================
// ASSESSMENT HEADER
// =====================================================

import {
  CalendarClock,
  ChevronDown,
  FilePlus2,
  FileText,
  UserPlus,
} from "lucide-react";

import {
  Banner,
} from "@/components/banner/topBanner";

import {
  FloatingParticles,
} from "@/components/design/FloatingParticles";

import {
  IconBadge,
} from "@/components/commen/icon-badge";

import {
  Button,
} from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type {
  AssessmentConfig,
} from "./assessment.config";


// =====================================================
// PROPS
// =====================================================

type AssessmentHeaderProps = {
  config: AssessmentConfig;

  onCreate: () => void;

  onRegisterTaxpayer: () => void;

  onRegisterExistingAgreement: () => void;

  onManageScheduledPayments: () => void;
};


// =====================================================
// COMPONENT
// =====================================================

export function AssessmentHeader({
  config,

  onCreate,

  onRegisterTaxpayer,

  onRegisterExistingAgreement,

  onManageScheduledPayments,

}: AssessmentHeaderProps) {

  return (
    <Banner
      badge={
        <IconBadge
          className="
            gap-2
            rounded-full
            bg-black/20
            p-3
            text-[10px]
            text-white
          "
          icon={
            <config.icon
              className="
                h-4
                w-4
              "
            />
          }
        >
          {config.badge}
        </IconBadge>
      }

      description={
        config.description
      }

      background={
        <FloatingParticles
          color="#040404"
          count={35}
          speed={0.2}
          connectDistance={100}
          position="bottom-right"
        />
      }

      overlayClassName="
        bg-gradient-to-r
        from-primary/95
        via-primary/80
        to-primary/50
      "

      className="
        text-white
      "

      actions={
        <div
          className="
            flex
            flex-wrap
            items-center
            gap-2
          "
        >

          {/* ============================================================
              PRIMARY ACTION
              ============================================================ */}

          <Button
            type="button"
            onClick={
              onCreate
            }
            className="
              gap-2
              bg-white
              text-primary
              shadow-sm
              hover:bg-white/90
            "
          >
            <FilePlus2
              className="
                h-4
                w-4
              "
            />

            New Assessment
          </Button>


          {/* ============================================================
              MORE ACTIONS DROPDOWN
              ============================================================ */}

          <DropdownMenu>

            <DropdownMenuTrigger
              asChild
            >
              <Button
                type="button"
                variant="outline"
                className="
                  gap-2
                  border-white/30
                  bg-white/10
                  text-white
                  backdrop-blur-sm
                  hover:bg-white
                  hover:text-primary
                "
              >
                Actions

                <ChevronDown
                  className="
                    h-4
                    w-4
                  "
                />
              </Button>
            </DropdownMenuTrigger>


            {/* ==========================================================
                DROPDOWN CONTENT
                ========================================================== */}

            <DropdownMenuContent
              align="end"
              className="
                w-72
              "
            >

              {/* --------------------------------------------------------
                  REGISTER EXISTING AGREEMENT
                  -------------------------------------------------------- */}

              <DropdownMenuItem
                onClick={
                  onRegisterExistingAgreement
                }
                className="
                  cursor-pointer
                  gap-3
                  py-3
                "
              >
                <FileText
                  className="
                    h-4
                    w-4
                    text-muted-foreground
                  "
                />

                <div
                  className="
                    flex
                    flex-col
                  "
                >
                  <span
                    className="
                      font-medium
                    "
                  >
                    Existing Agreement
                  </span>

                  <span
                    className="
                      text-xs
                      text-muted-foreground
                    "
                  >
                    Register an existing agreement
                  </span>
                </div>
              </DropdownMenuItem>


              <DropdownMenuSeparator />


              {/* --------------------------------------------------------
                  REGISTER TAXPAYER
                  -------------------------------------------------------- */}

              <DropdownMenuItem
                onClick={
                  onRegisterTaxpayer
                }
                className="
                  cursor-pointer
                  gap-3
                  py-3
                "
              >
                <UserPlus
                  className="
                    h-4
                    w-4
                    text-muted-foreground
                  "
                />

                <div
                  className="
                    flex
                    flex-col
                  "
                >
                  <span
                    className="
                      font-medium
                    "
                  >
                    Register Taxpayer
                  </span>

                  <span
                    className="
                      text-xs
                      text-muted-foreground
                    "
                  >
                    Add a new taxpayer
                  </span>
                </div>
              </DropdownMenuItem>


              <DropdownMenuSeparator />


              {/* --------------------------------------------------------
                  SCHEDULED PAYMENT MANAGEMENT
                  -------------------------------------------------------- */}

              <DropdownMenuItem
                onClick={
                  onManageScheduledPayments
                }
                className="
                  cursor-pointer
                  gap-3
                  py-3
                "
              >
                <CalendarClock
                  className="
                    h-4
                    w-4
                    text-muted-foreground
                  "
                />

                <div
                  className="
                    flex
                    flex-col
                  "
                >
                  <span
                    className="
                      font-medium
                    "
                  >
                    Scheduled Payments
                  </span>

                  <span
                    className="
                      text-xs
                      text-muted-foreground
                    "
                  >
                    Manage payment schedules and installments
                  </span>
                </div>
              </DropdownMenuItem>

            </DropdownMenuContent>

          </DropdownMenu>

        </div>
      }
    />
  );
}
