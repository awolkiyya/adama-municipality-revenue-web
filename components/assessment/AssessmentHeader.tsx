"use client";

// =====================================================
// ASSESSMENT HEADER
// =====================================================

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

import type {
  AssessmentConfig,
} from "./assessment.config";
import { Icon } from "lucide-react";


// =====================================================
// PROPS
// =====================================================

type AssessmentHeaderProps = {

  config:
    AssessmentConfig;

  onCreate:
    () => void;

  onRegisterTaxpayer:
    () => void;

  onRegisterExistingAgreement:
    () => void;
};


// =====================================================
// COMPONENT
// =====================================================

export function AssessmentHeader({
  config,

  onCreate,

  onRegisterTaxpayer,

  onRegisterExistingAgreement,

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
            gap-3
          "
        >

          {/* ==========================================
              CREATE ASSESSMENT
              ========================================== */}

        
                <Button

                  type="button"
                  onClick={
                    onCreate
                  }
                  className="
                    bg-white
                    text-primary
                    shadow-sm
                    hover:bg-white/90
                  "
                >

                  {/* <Icon
                    className="
                      mr-2
                      h-4
                      w-4
                    "
                  /> */}

                 New Assissment

                </Button>
     


          {/* ==========================================
              REGISTER EXISTING AGREEMENT
              ALWAYS DISPLAYED
              ========================================== */}

          <Button
            type="button"
            variant="outline"
            onClick={
              onRegisterExistingAgreement
            }
            className="
              border-white/30
              bg-white/10
              text-white
              backdrop-blur-sm
              hover:bg-white
              hover:text-primary
            "
          >

            Register Existing Agreement

          </Button>


          {/* ==========================================
              REGISTER TAXPAYER
              ALWAYS DISPLAYED
              ========================================== */}

          <Button
            type="button"
            variant="outline"
            onClick={
              onRegisterTaxpayer
            }
            className="
              border-white/30
              bg-white/10
              text-white
              backdrop-blur-sm
              hover:bg-white
              hover:text-primary
            "
          >

            Register Taxpayer

          </Button>

        </div>
      }
    />
  );
}
