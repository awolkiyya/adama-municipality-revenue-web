import {
    useMutation,
    useQuery,
    useQueryClient,
  } from "@tanstack/react-query";
  
  
  import {
    serviceAccessRuleService,
  } from "@/services/revenue/serviceAccessRule.service";
  
  
  import {
    ServiceAccessRule,
    CreateServiceAccessRulePayload,
    UpdateServiceAccessRulePayload,
    ServiceAccessRuleSummary,
  } from "@/types/revenue/service-access-rule";
  
  
  import {
    ListResponse,
  } from "@/types/api";
  
  
  import {
    toast,
  } from "sonner";
  
  
  
  
  /* --------------------------------------
     GET ALL SERVICE ACCESS RULES
  -------------------------------------- */
  
  export const useServiceAccessRules = (
    serviceId:string,
    params?:{
      sector_id?:string;
      role_id?:string;
      is_active?:boolean;
      page?:number;
      per_page?:number;
    }
  )=>{
  
  
    return useQuery<ListResponse<ServiceAccessRule, ServiceAccessRuleSummary>>({
  
      queryKey:[
        "service-access-rules",
        serviceId,
        params,
      ],
  
  
      queryFn:() =>
        serviceAccessRuleService.getRules(
          serviceId,
          params
        ),
  
  
      enabled:
        !!serviceId,
  
  
      staleTime:
        1000 * 60 * 2,
  
  
      placeholderData:
        (previousData)=>previousData,
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     GET SINGLE RULE
  -------------------------------------- */
  
  
  export const useServiceAccessRule = (
    serviceId:string,
    ruleId:string,
    enabled=true
  )=>{
  
  
    return useQuery({
  
      queryKey:[
        "service-access-rule",
        serviceId,
        ruleId,
      ],
  
  
      queryFn:() =>
        serviceAccessRuleService.getRuleById(
          serviceId,
          ruleId
        ),
  
  
      enabled:
        enabled &&
        !!serviceId &&
        !!ruleId,
  
  
      staleTime:
        1000 * 60 * 2,
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     CREATE RULE
  -------------------------------------- */
  
  
  export const useCreateServiceAccessRule = () => {
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
      mutationFn:({
        serviceId,
        data,
      }:{
        serviceId:string;
        data:CreateServiceAccessRulePayload;
      }) =>
  
        serviceAccessRuleService.createRule(
          serviceId,
          data
        ),
  
  
  
      onSuccess:(_,variables)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "service-access-rules",
            variables.serviceId,
          ],
  
        });
  
  
  
        toast.success(
          "Service access rule created successfully"
        );
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     UPDATE RULE
  -------------------------------------- */
  
  
  export const useUpdateServiceAccessRule = () => {
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:({
        serviceId,
        ruleId,
        data,
      }:{
        serviceId:string;
        ruleId:string;
        data:UpdateServiceAccessRulePayload;
      }) =>
  
  
        serviceAccessRuleService.updateRule(
          serviceId,
          ruleId,
          data
        ),
  
  
  
  
      onSuccess:(_,variables)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "service-access-rules",
            variables.serviceId,
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "service-access-rule",
            variables.serviceId,
            variables.ruleId,
          ],
  
        });
  
  
  
        toast.success(
          "Service access rule updated successfully"
        );
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     ACTIVATE RULE
  -------------------------------------- */
  
  
  export const useActivateServiceAccessRule = () => {
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:({
        serviceId,
        ruleId,
      }:{
        serviceId:string;
        ruleId:string;
      }) =>
  
  
        serviceAccessRuleService.activateRule(
          serviceId,
          ruleId
        ),
  
  
  
      onSuccess:(_,variables)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "service-access-rules",
            variables.serviceId,
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "service-access-rule",
            variables.serviceId,
            variables.ruleId,
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     DEACTIVATE RULE
  -------------------------------------- */
  
  
  export const useDeactivateServiceAccessRule = () => {
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:({
        serviceId,
        ruleId,
      }:{
        serviceId:string;
        ruleId:string;
      }) =>
  
  
        serviceAccessRuleService.deactivateRule(
          serviceId,
          ruleId
        ),
  
  
  
      onSuccess:(_,variables)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "service-access-rules",
            variables.serviceId,
          ],
  
        });
  
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "service-access-rule",
            variables.serviceId,
            variables.ruleId,
          ],
  
        });
  
  
      },
  
  
    });
  
  
  };
  
  
  
  
  
  
  
  
  
  /* --------------------------------------
     DELETE RULE
  -------------------------------------- */
  
  
  export const useDeleteServiceAccessRule = () => {
  
  
    const queryClient =
      useQueryClient();
  
  
  
    return useMutation({
  
  
      mutationFn:({
        serviceId,
        ruleId,
      }:{
        serviceId:string;
        ruleId:string;
      }) =>
  
  
        serviceAccessRuleService.deleteRule(
          serviceId,
          ruleId
        ),
  
  
  
  
      onSuccess:(_,variables)=>{
  
  
        queryClient.invalidateQueries({
  
          queryKey:[
            "service-access-rules",
            variables.serviceId,
          ],
  
        });
  
  
  
        toast.success(
          "Service access rule deleted successfully"
        );
  
  
      },
  
  
    });
  
  
  };