// =====================================================
// ASSESSMENT UTILITIES
// =====================================================

import type {
    Assessment,
    AssessmentFilters,
    AssessmentService,
  } from "@/types/revenue/assessment";
  
  
  // =====================================================
  // INITIAL FILTERS
  // =====================================================
  
  export const INITIAL_ASSESSMENT_FILTERS:
    AssessmentFilters & {
      date: {
        from?: Date;
        to?: Date;
      } | null;
    } = {
      status: "ALL",
  
      date: null,
    };
  
  
  // =====================================================
  // SERVICE MAP
  // =====================================================
  
  export type RevenueServiceMapValue = {
    id: string;
    name: string;
    code: string;
  };
  
  export type RevenueServiceMap =
    Map<
      string,
      RevenueServiceMapValue
    >;
  
  
  // =====================================================
  // FORMAT STATUS
  // =====================================================
  
  export function formatAssessmentStatus(
    status: string,
  ): string {
  
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase(),
      );
  }
  
  
  // =====================================================
  // SERVICE NAME
  // =====================================================
  
  export function getAssessmentServiceName(
    services:
      | AssessmentService[]
      | undefined,
  
    revenueServiceMap:
      RevenueServiceMap,
  ): string {
  
    if (
      !services ||
      services.length === 0
    ) {
      return "-";
    }
  
    const names =
      services
        .map((service) => {
  
          const byId =
            revenueServiceMap.get(
              service.serviceId,
            );
  
          if (byId) {
            return byId.name;
          }
  
          const serviceCode =
            service.service?.code ??
            service.serviceCode;
  
          if (serviceCode) {
  
            const byCode =
              revenueServiceMap.get(
                serviceCode,
              );
  
            if (byCode) {
              return byCode.name;
            }
          }
  
          return (
            service.serviceCode ??
            service.serviceId ??
            "-"
          );
        })
        .filter(
          (name) =>
            name !== "-",
        );
  
    return (
      names.join(", ") ||
      "-"
    );
  }
  
  
  // =====================================================
  // BUILD SERVICE MAP
  // =====================================================
  
  export function buildRevenueServiceMap(
    services: any[] = [],
  ): RevenueServiceMap {
  
    const map:
      RevenueServiceMap =
      new Map();
  
    services.forEach((service) => {
  
      const value = {
        id: service.id,
        name: service.name,
        code:
          service.revenueCode?.code ??
          service.id,
      };
  
      map.set(
        service.id,
        value,
      );
  
      if (
        service.revenueCode?.code
      ) {
  
        map.set(
          service.revenueCode.code,
          value,
        );
      }
    });
  
    return map;
  }
  
  
  // =====================================================
  // ASSESSMENT REFERENCE
  // =====================================================
  
  export function getAssessmentReference(
    assessment: Assessment,
  ): string {
  
    return (
      assessment.assessmentNumber ??
      assessment.id ??
      "-"
    );
  }
  
  
  // =====================================================
  // TABLE ROW
  // =====================================================
  
  export function transformAssessmentForTable(
    assessment: Assessment,
  
    revenueServiceMap:
      RevenueServiceMap,
  ) {
  
    return {
  
      ...assessment,
  
      id:
        assessment.id,
  
      assessment_number:
        getAssessmentReference(
          assessment,
        ),
  
      taxpayer_name:
        assessment.taxpayer?.fullName ??
        "-",
  
      taxpayer_no:
        assessment.taxpayer?.citizenUid ??
        "-",
  
      revenue_service:
        getAssessmentServiceName(
          assessment.services,
          revenueServiceMap,
        ),
  
      status:
        assessment.status,
  
      created_at:
        assessment.createdAt,
  
      created_by:
        assessment.createdBy?.name ??
        "-",
    };
  }
  
  
  // =====================================================
  // TABLE DATA
  // =====================================================
  
  export function transformAssessmentsForTable(
    assessments: Assessment[],
  
    revenueServiceMap:
      RevenueServiceMap,
  ) {
  
    return assessments.map(
      (assessment) =>
        transformAssessmentForTable(
          assessment,
          revenueServiceMap,
        ),
    );
  }