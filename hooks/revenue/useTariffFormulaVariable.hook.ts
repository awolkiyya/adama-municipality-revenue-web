import {
    useMutation,
    useQuery,
    useQueryClient,
  } from "@tanstack/react-query";
  
  import {
    TariffFormulaVariable,
    CreateTariffFormulaVariableRequest,
    UpdateTariffFormulaVariableRequest,
    TariffFormulaVariableApiPayload,
  } from "@/types/revenue/tariff-formula-variable";
  
  import {
    ApiResponse,
    ListResponse,
  } from "@/types/api";
  
  import { toast } from "sonner";
  
  import {
    tariffFormulaVariableService,
  } from "@/services/revenue/tariffFormulaVariable.service";
  
  /*
  |--------------------------------------------------------------------------
  | QUERY KEYS
  |--------------------------------------------------------------------------
  */
  
  const FORMULA_VARIABLES_KEY = "tariff-formula-variables";
  
  /*
  |--------------------------------------------------------------------------
  | GET ALL FORMULA VARIABLES
  |--------------------------------------------------------------------------
  */
  
  export const useTariffFormulaVariables = (
    tariffRuleId: string,
    enabled = true
  ) => {
    return useQuery<
      ListResponse<TariffFormulaVariable>
    >({
      queryKey: [
        FORMULA_VARIABLES_KEY,
        tariffRuleId,
      ],
  
      queryFn: () =>
        tariffFormulaVariableService.getFormulaVariables(
          tariffRuleId
        ),
  
      enabled:
        enabled &&
        !!tariffRuleId,
  
      staleTime:
        1000 * 60 * 2,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | GET SINGLE FORMULA VARIABLE
  |--------------------------------------------------------------------------
  */
  
  export const useTariffFormulaVariable = (
    tariffRuleId: string,
    variableId: string,
    enabled = true
  ) => {
    return useQuery<
      ApiResponse<TariffFormulaVariable>
    >({
      queryKey: [
        FORMULA_VARIABLES_KEY,
        tariffRuleId,
        variableId,
      ],
  
      queryFn: () =>
        tariffFormulaVariableService.getFormulaVariableById(
          tariffRuleId,
          variableId
        ),
  
      enabled:
        enabled &&
        !!tariffRuleId &&
        !!variableId,
  
      staleTime:
        1000 * 60 * 2,
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | CREATE FORMULA VARIABLE
  |--------------------------------------------------------------------------
  */
  
  export const useCreateTariffFormulaVariable = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: ({
        tariffRuleId,
        data,
      }: {
        tariffRuleId: string;
        data: TariffFormulaVariableApiPayload;
      }) =>
        tariffFormulaVariableService.createFormulaVariable(
          tariffRuleId,
          data
        ),
  
      onSuccess: (_, variables) => {
        /*
        |--------------------------------------------------------------------------
        | Refresh variables for the tariff rule
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            FORMULA_VARIABLES_KEY,
            variables.tariffRuleId,
          ],
        });
  
        /*
        |--------------------------------------------------------------------------
        | Refresh tariff rule
        |--------------------------------------------------------------------------
        |
        | The formula variable belongs to the tariff rule,
        | so the rule may have changed through the relationship.
        |
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            "tariff-rule",
            variables.tariffRuleId,
          ],
        });
  
        toast.success(
          "Formula variable created successfully"
        );
      },
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | UPDATE FORMULA VARIABLE
  |--------------------------------------------------------------------------
  */
  
  export const useUpdateTariffFormulaVariable = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: ({
        tariffRuleId,
        variableId,
        data,
      }: {
        tariffRuleId: string;
        variableId: string;
        data: TariffFormulaVariableApiPayload;
      }) =>
        tariffFormulaVariableService.updateFormulaVariable(
          tariffRuleId,
          variableId,
          data
        ),
  
      onSuccess: (_, variables) => {
        /*
        |--------------------------------------------------------------------------
        | Refresh formula variables
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            FORMULA_VARIABLES_KEY,
            variables.tariffRuleId,
          ],
        });
  
        /*
        |--------------------------------------------------------------------------
        | Refresh individual variable
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            FORMULA_VARIABLES_KEY,
            variables.tariffRuleId,
            variables.variableId,
          ],
        });
  
        /*
        |--------------------------------------------------------------------------
        | Refresh parent tariff rule
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            "tariff-rule",
            variables.tariffRuleId,
          ],
        });
  
        toast.success(
          "Formula variable updated successfully"
        );
      },
    });
  };
  
  /*
  |--------------------------------------------------------------------------
  | DELETE FORMULA VARIABLE
  |--------------------------------------------------------------------------
  */
  
  export const useDeleteTariffFormulaVariable = () => {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: ({
        tariffRuleId,
        variableId,
      }: {
        tariffRuleId: string;
        variableId: string;
      }) =>
        tariffFormulaVariableService.deleteFormulaVariable(
          tariffRuleId,
          variableId
        ),
  
      onSuccess: (_, variables) => {
        /*
        |--------------------------------------------------------------------------
        | Refresh formula variables
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            FORMULA_VARIABLES_KEY,
            variables.tariffRuleId,
          ],
        });
  
        /*
        |--------------------------------------------------------------------------
        | Remove individual variable cache
        |--------------------------------------------------------------------------
        */
  
        queryClient.removeQueries({
          queryKey: [
            FORMULA_VARIABLES_KEY,
            variables.tariffRuleId,
            variables.variableId,
          ],
        });
  
        /*
        |--------------------------------------------------------------------------
        | Refresh parent tariff rule
        |--------------------------------------------------------------------------
        */
  
        queryClient.invalidateQueries({
          queryKey: [
            "tariff-rule",
            variables.tariffRuleId,
          ],
        });
  
        toast.success(
          "Formula variable deleted successfully"
        );
      },
    });
  };