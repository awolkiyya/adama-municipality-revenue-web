// hooks/use-mobile-app-releases.ts

"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  mobileAppReleasesService,
} from "@/services/mobile-app-releases-service";

import type {
  CreateMobileAppReleasePayload,
  MobileAppRelease,
  MobileAppReleaseFilters,
  PublishMobileAppReleasePayload,
  UpdateMobileAppReleasePayload,
  WithdrawMobileAppReleasePayload,
} from "@/types/mobile-app-release";

/**
 * Query keys for the mobile app releases module.
 *
 * Centralized keys simplify cache management after creating,
 * updating, publishing, or withdrawing releases.
 */
export const mobileAppReleaseKeys = {
  all: ["mobile-app-releases"] as const,

  lists: () =>
    [...mobileAppReleaseKeys.all, "list"] as const,

  list: (filters: MobileAppReleaseFilters = {}) =>
    [...mobileAppReleaseKeys.lists(), filters] as const,

  details: () =>
    [...mobileAppReleaseKeys.all, "detail"] as const,

  detail: (id: string) =>
    [...mobileAppReleaseKeys.details(), id] as const,

  latest: () =>
    [...mobileAppReleaseKeys.all, "latest"] as const,
};

/**
 * Validate a release UUID before fetching a detail record.
 */
function isValidReleaseId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    id,
  );
}

/**
 * Fetch mobile app releases with search, status filtering,
 * pagination, sorting, and other supported filters.
 */
export function useMobileAppReleases(
  filters: MobileAppReleaseFilters = {},
) {
  return useQuery({
    queryKey: mobileAppReleaseKeys.list(filters),

    queryFn: () =>
      mobileAppReleasesService.getAll(filters),

    staleTime: 30 * 1000,
  });
}

/**
 * Fetch a single mobile app release by UUID.
 */
export function useMobileAppRelease(
  id: string,
  enabled = true,
) {
  return useQuery({
    queryKey: mobileAppReleaseKeys.detail(id),

    queryFn: () =>
      mobileAppReleasesService.getById(id),

    enabled: enabled && isValidReleaseId(id),

    staleTime: 30 * 1000,
  });
}

/**
 * Fetch the latest published mobile app release.
 */
export function useLatestMobileAppRelease(
  enabled = true,
) {
  return useQuery({
    queryKey: mobileAppReleaseKeys.latest(),

    queryFn: () =>
      mobileAppReleasesService.getLatest(),

    enabled,

    staleTime: 60 * 1000,
  });
}

/**
 * Create a mobile app release and upload its APK.
 */
export function useCreateMobileAppRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      payload: CreateMobileAppReleasePayload,
    ) => mobileAppReleasesService.create(payload),

    onSuccess: async (release) => {
      if (release.id) {
        queryClient.setQueryData(
          mobileAppReleaseKeys.detail(release.id),
          release,
        );
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: mobileAppReleaseKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: mobileAppReleaseKeys.latest(),
        }),
      ]);
    },
  });
}

/**
 * Update release metadata or replace its APK.
 */
export function useUpdateMobileAppRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateMobileAppReleasePayload;
    }) => mobileAppReleasesService.update(id, payload),

    onSuccess: async (release, variables) => {
      queryClient.setQueryData(
        mobileAppReleaseKeys.detail(variables.id),
        release,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: mobileAppReleaseKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: mobileAppReleaseKeys.detail(variables.id),
        }),

        queryClient.invalidateQueries({
          queryKey: mobileAppReleaseKeys.latest(),
        }),
      ]);
    },
  });
}

/**
 * Publish a draft release.
 */
export function usePublishMobileAppRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload = {},
    }: {
      id: string;
      payload?: PublishMobileAppReleasePayload;
    }) => mobileAppReleasesService.publish(id, payload),

    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: mobileAppReleaseKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: mobileAppReleaseKeys.detail(variables.id),
        }),

        queryClient.invalidateQueries({
          queryKey: mobileAppReleaseKeys.latest(),
        }),
      ]);
    },
  });
}

/**
 * Withdraw a published release.
 */
export function useWithdrawMobileAppRelease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload = {},
    }: {
      id: string;
      payload?: WithdrawMobileAppReleasePayload;
    }) => mobileAppReleasesService.withdraw(id, payload),

    onSuccess: async (_response, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: mobileAppReleaseKeys.lists(),
        }),

        queryClient.invalidateQueries({
          queryKey: mobileAppReleaseKeys.detail(variables.id),
        }),

        queryClient.invalidateQueries({
          queryKey: mobileAppReleaseKeys.latest(),
        }),
      ]);
    },
  });
}

/**
 * Delete a mobile app release.
 *
 * Enable this only after implementing and authorizing the
 * corresponding DELETE endpoint in Laravel.
 */
// export function useDeleteMobileAppRelease() {
//   const queryClient = useQueryClient();
//
//   return useMutation({
//     mutationFn: (id: string) =>
//       mobileAppReleasesService.delete(id),
//
//     onSuccess: async (_response, id) => {
//       queryClient.removeQueries({
//         queryKey: mobileAppReleaseKeys.detail(id),
//         exact: true,
//       });
//
//       await Promise.all([
//         queryClient.invalidateQueries({
//           queryKey: mobileAppReleaseKeys.lists(),
//         }),
//
//         queryClient.invalidateQueries({
//           queryKey: mobileAppReleaseKeys.latest(),
//         }),
//       ]);
//     },
//   });
// }

