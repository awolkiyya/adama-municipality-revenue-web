/**
 * src/services/taxpayer/taxpayer-dashboard.service.ts
 *
 * Taxpayer Dashboard Service
 *
 * Responsibility:
 * - Fetch the authenticated taxpayer's dashboard.
 *
 * Backend endpoint:
 * GET /api/v1/taxpayer/dashboard
 *
 * Authentication:
 * - Handled by the existing application API client.
 * - The frontend does NOT send a taxpayer ID.
 *
 * Backend resource:
 * App\Modules\Taxpayer\Resources\TaxpayerDashboardResource
 */

import { api } from "@/lib/api";
import type {
    TaxpayerDashboard,
  } from "@/types/taxpayer/dashboard";
  
  
  /* ============================================================================
   * SERVICE
   * ========================================================================== */
  
  export const taxpayerDashboardService = {
    /**
     * Get the authenticated taxpayer dashboard.
     *
     * The backend determines the taxpayer from the authenticated
     * Sanctum session.
     *
     * Endpoint:
     * GET /api/v1/taxpayer/dashboard
     */
    async getDashboard(): Promise<TaxpayerDashboard> {
      const response = await api.get(
        "/taxpayer/dashboard"
      );
  
      return response.data.data;
    },
  };
  
  /* ============================================================================
   * DEFAULT EXPORT
   * ========================================================================== */
  
  export default taxpayerDashboardService;