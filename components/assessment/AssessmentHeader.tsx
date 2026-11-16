
"use client";

// =====================================================
// ASSESSMENT HEADER
// =====================================================

import {
  ChevronDown,
  FilePlus2,
  FileText,
  List,
  UserPlus,
} from "lucide-react";


import { Banner } from "@/components/banner/topBanner";
import { FloatingParticles } from "@/components/design/FloatingParticles";
import { IconBadge } from "@/components/commen/icon-badge";
import { Button } from "@/components/ui/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { AssessmentConfig } from "./assessment.config";
import Can from "../access/Can";

// =====================================================
// PROPS
// =====================================================

type AssessmentHeaderProps = {
  config: AssessmentConfig;

  onCreate: () => void;

  onList?: () => void;

  onRegisterTaxpayer: () => void;

  onRegisterExistingAgreement: () => void;
};

// =====================================================
// COMPONENT
// =====================================================

export function AssessmentHeader({
  config,
  onCreate,
  onList,
  onRegisterTaxpayer,
  onRegisterExistingAgreement,
}: AssessmentHeaderProps) {
  return (
    <Banner
      badge={
        <IconBadge
          className="gap-2 rounded-full p-3 text-[10px]"
          icon={<config.icon className="h-4 w-4" />}
        >
          {config.badge}
        </IconBadge>
      }
      description={config.description}
      background={
        <FloatingParticles
          count={35}
          speed={0.2}
          connectDistance={100}
          position="bottom-right"
        />
      }
      overlayClassName="bg-transparent"
      actions={
        <div className="flex flex-wrap items-center gap-2">

          {/* =========================================
              ASSESSMENT LIST
              Requires assessment.read OR assessment.view
              ========================================= */}

          {onList && (
            <>
              <Can
                resource="assessment"
                action="read"
                fallback={
                  <Can
                    resource="assessment"
                    action="view"
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={onList}
                    >
                      <List className="h-4 w-4" />
                      Assessment List
                    </Button>
                  </Can>
                }
              >
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onList}
                >
                  <List className="h-4 w-4" />
                  Assessment List
                </Button>
              </Can>
            </>
          )}

          {/* =========================================
              NEW ASSESSMENT
              Requires assessment.create
              ========================================= */}

          <Can
            resource="assessment"
            action="create"
          >
            <Button
              type="button"
              variant="default"
              onClick={onCreate}
            >
              <FilePlus2 className="h-4 w-4" />
              New Assessment
            </Button>
          </Can>

          {/* =========================================
              MORE ACTIONS
              ========================================= */}

          <Can
            resource="assessment"
            action="create"
            fallback={
              <Can
                resource="citizens"
                action="create"
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="secondary"
                    >
                      Actions
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-72"
                  >
                    <DropdownMenuItem
                      onClick={onRegisterTaxpayer}
                      className="cursor-pointer gap-3 py-3"
                    >
                      <UserPlus className="h-4 w-4 text-muted-foreground" />

                      <div className="flex flex-col">
                        <span className="font-medium">
                          Register Taxpayer
                        </span>

                        <span className="text-xs text-muted-foreground">
                          Add a new taxpayer
                        </span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </Can>
            }
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                >
                  Actions
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-72"
              >
                {/* =====================================
                    EXISTING AGREEMENT
                    Requires assessment.create
                    ===================================== */}

                <DropdownMenuItem
                  onClick={onRegisterExistingAgreement}
                  className="cursor-pointer gap-3 py-3"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />

                  <div className="flex flex-col">
                    <span className="font-medium">
                      Existing Agreement
                    </span>

                    <span className="text-xs text-muted-foreground">
                      Register an existing agreement
                    </span>
                  </div>
                </DropdownMenuItem>

                {/* =====================================
                    REGISTER TAXPAYER
                    Requires citizens.create
                    ===================================== */}

                <Can
                  resource="citizens"
                  action="create"
                >
                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={onRegisterTaxpayer}
                    className="cursor-pointer gap-3 py-3"
                  >
                    <UserPlus className="h-4 w-4 text-muted-foreground" />

                    <div className="flex flex-col">
                      <span className="font-medium">
                        Register Taxpayer
                      </span>

                      <span className="text-xs text-muted-foreground">
                        Add a new taxpayer
                      </span>
                    </div>
                  </DropdownMenuItem>
                </Can>
              </DropdownMenuContent>
            </DropdownMenu>
          </Can>
        </div>
      }
    />
  );
}
