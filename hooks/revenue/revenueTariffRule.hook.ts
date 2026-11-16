import {
    useMutation,
    useQuery,
    useQueryClient,
  } from "@tanstack/react-query";
  
  
  
  
  import {
    ApiResponse,
  } from "@/types/api";
  
  
  import {
    toast,
  } from "sonner";
  
  
  import {
    tariffRuleService,
  } from "@/services/revenue/tariffRule.service";
import { CreateTariffRulePayload, TariffRuleRecord, UpdateTariffRulePayload } from "@/types/revenue/tariff-form";
  
  
  
  
  
  /* --------------------------------------
     GET ALL TARIFF RULES
  -------------------------------------- */
  
  export const useTariffRules = (
    params:{
      tariff_version_id:string;
      page?:number;
      per_page?:number;
      service_id?:string;
      calculation_type?:string;
      is_active?:boolean;
    }
  )=>{
  
  
    return useQuery({
  
      queryKey:[
        "tariff-rules",
        params,
      ],
  
  
      queryFn:()=> 
        tariffRuleService.getTariffRules(
          params.tariff_version_id,
          params
        ),
  
  
      enabled:
        !!params.tariff_version_id,
  
  
      staleTime:
        1000 * 60 * 2,
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  /* --------------------------------------
     GET SINGLE TARIFF RULE
  -------------------------------------- */
  
  export const useTariffRule = (
    id:string,
    tariff_version_id:string,
    enabled=true
  )=>{
  
  
    return useQuery<
      ApiResponse<TariffRuleRecord>
    >({
  
      queryKey:[
        "tariff-rule",
        id,
      ],
  
  
      queryFn:() =>
        tariffRuleService.getTariffRuleById(
          id,
          tariff_version_id
        ),
  
  
      enabled:
        enabled &&
        !!id,
  
  
      staleTime:
        1000 * 60 * 2,
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     CREATE TARIFF RULE
  -------------------------------------- */
  
  export const useCreateTariffRule = ()=>{

    const queryClient = useQueryClient();
  
  
    return useMutation({
  
      mutationFn:({
        tariffVersionId,
        data,
      }:{
        tariffVersionId:string;
        data:CreateTariffRulePayload;
      })=>
        tariffRuleService.createTariffRule(
          tariffVersionId,
          data
        ),
  
  
  
      onSuccess:(_,variables)=>{
  
  
        queryClient.invalidateQueries({
          queryKey:[
            "tariff-rules",
            variables.tariffVersionId
          ]
        });
  
  
        toast.success(
          "Tariff rule created successfully"
        );
  
  
      },
  
  
    });
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     UPDATE TARIFF RULE
  -------------------------------------- */
  
  export const useUpdateTariffRule = ()=>{
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
      mutationFn:({
        tariffVersionId,
        id,
        data,
      }:{
        tariffVersionId:string;
        id:string;
        data:UpdateTariffRulePayload;
      }) =>
  
  
        tariffRuleService.updateTariffRule(
          tariffVersionId,
          id,
          data
        ),
  
  
  
  
  
      onSuccess:(_,variables)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "tariff-rules",
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "tariff-rule",
            variables.id,
          ],
  
        });
  
  
  
        toast.success(
          "Tariff rule updated successfully"
        );
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     DELETE TARIFF RULE
  -------------------------------------- */
  
  export const useDeleteTariffRule = ()=>{
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
      mutationFn:(
        id:string
      ) =>
        tariffRuleService.deleteTariffRule(
          id
        ),
  
  
  
  
      onSuccess:()=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "tariff-rules",
          ],
  
        });
  
  
  
        toast.success(
          "Tariff rule deleted successfully"
        );
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     RESTORE TARIFF RULE
  -------------------------------------- */
  
  export const useRestoreTariffRule = ()=>{
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
      mutationFn:(
        id:string
      ) =>
        tariffRuleService.restoreTariffRule(
          id
        ),
  
  
  
  
  
      onSuccess:()=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "tariff-rules",
          ],
  
        });
  
  
  
        toast.success(
          "Tariff rule restored successfully"
        );
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     ACTIVATE TARIFF RULE
  -------------------------------------- */
  
  export const useActivateTariffRule = ()=>{
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
      mutationFn:(
        id:string
      ) =>
        tariffRuleService.activateTariffRule(
          id
        ),
  
  
  
  
  
      onSuccess:(_,id)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "tariff-rules",
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "tariff-rule",
            id,
          ],
  
        });
  
  
  
        toast.success(
          "Tariff rule activated successfully"
        );
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     DEACTIVATE TARIFF RULE
  -------------------------------------- */
  
  export const useDeactivateTariffRule = ()=>{
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
      mutationFn:(
        id:string
      ) =>
        tariffRuleService.deactivateTariffRule(
          id
        ),
  
  
  
  
  
      onSuccess:(_,id)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "tariff-rules",
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "tariff-rule",
            id,
          ],
  
        });
  
  
  
        toast.success(
          "Tariff rule deactivated successfully"
        );
  
  
      },
  
  
    });
  
  
  };


/* --------------------------------------
   COPY TARIFF FORMULA VARIABLES
-------------------------------------- */

export const useCopyTariffFormula = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tariffVersionId,
      sourceRuleId,
      destinationRuleId,
      options,
    }: {
      tariffVersionId: string;
      sourceRuleId: string;
      destinationRuleId: string;
      options: {
        variables: boolean;
      };
    }) =>
      tariffRuleService.copyFormula(
        tariffVersionId,
        destinationRuleId,
        {
          source_rule_id: sourceRuleId,
          options,
        },
      ),

    onSuccess: (_, variables) => {
      // Refresh the tariff rules list.
      queryClient.invalidateQueries({
        queryKey: ["tariff-rules"],
      });

      // Refresh source and destination rule details.
      queryClient.invalidateQueries({
        queryKey: ["tariff-rule", variables.sourceRuleId],
      });

      queryClient.invalidateQueries({
        queryKey: ["tariff-rule", variables.destinationRuleId],
      });

      // Refresh destination formula variables.
      queryClient.invalidateQueries({
        queryKey: [
          "tariff-formula-variables",
          variables.destinationRuleId,
        ],
      });

      toast.success(
        "Formula variables copied successfully.",
      );
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to copy formula variables.",
      );
    },
  });
};
