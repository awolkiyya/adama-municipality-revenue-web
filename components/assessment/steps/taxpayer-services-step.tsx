import {
    Trash2,
  } from "lucide-react";
  
  import {
    Button,
  } from "@/components/ui/button";
  
  import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card";
  
  import type { Citizen } from "@/types/citizen";
  
  import type {
    RevenueService,
  } from "@/types/revenue/assessment";
import { RevenueServiceSelector } from "@/components/revenue/assessment/revenue-service-selector";
import { TaxpayerSelector } from "@/components/revenue/assessment/taxpayer-selector";
  
  type TaxpayerServicesStepProps = {
    taxpayers: Citizen[];
    revenueServices: RevenueService[];
  
    taxpayerId: string;
    selectedServiceIds: string[];
  
    selectedTaxpayer: Citizen | null;
    selectedServices: RevenueService[];
  
    taxpayerLoading?: boolean;
    taxpayerError?: boolean;
  
    revenueServicesLoading?: boolean;
    revenueServicesError?: boolean;
  
    onRetryRevenueServices?: () => void;
  
    onTaxpayerChange: (
      taxpayerId: string,
    ) => void;
  
    onServiceSelectionChange: (
      serviceIds: string[],
    ) => void;
  
    onRemoveService: (
      serviceId: string,
    ) => void;
  
    onClearServices: () => void;
  };
  
  export function TaxpayerServicesStep({
    taxpayers,
    revenueServices,
  
    taxpayerId,
    selectedServiceIds,
  
    selectedTaxpayer,
    selectedServices,
  
    taxpayerLoading,
    taxpayerError,
  
    revenueServicesLoading,
    revenueServicesError,
  
    onRetryRevenueServices,
  
    onTaxpayerChange,
    onServiceSelectionChange,
  
    onRemoveService,
    onClearServices,
  }: TaxpayerServicesStepProps) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Taxpayer
            </CardTitle>
          </CardHeader>
  
          <CardContent>
            <TaxpayerSelector
              taxpayers={taxpayers}
              value={taxpayerId}
              onChange={onTaxpayerChange}
            />
          </CardContent>
        </Card>
  
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">
                  Revenue Services
                </CardTitle>
  
                <p className="mt-1 text-sm text-muted-foreground">
                  Select all services that apply
                  to this assessment.
                </p>
              </div>
  
              {selectedServiceIds.length >
                0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={
                    onClearServices
                  }
                  className="w-fit text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Clear all
                </Button>
              )}
            </div>
          </CardHeader>
  
          <CardContent className="space-y-5">
            <RevenueServiceSelector
            mode="multi"

                        services={revenueServices}
                        onChange={onServiceSelectionChange}
                        selectedServiceIds={selectedServiceIds}            
            />
          </CardContent>
        </Card>
      </div>
    );
  }