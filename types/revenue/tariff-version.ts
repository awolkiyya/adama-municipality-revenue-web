
export interface TariffVersion {
    id: string;

    year: number;

    version: number;

    name: string;

    description?: string | null;

    effectiveFrom: string;

    effectiveTo?: string | null;

    /**
     * Indicates whether this version is selected as the active tariff.
     * This is the authoritative field for determining the Active badge.
     */
    isActive: boolean;

    /**
     * Indicates whether the version's effective date range includes today.
     * This does not necessarily mean that the version is selected as active.
     */
    isCurrentlyEffective: boolean;

    tariffRulesCount?: number;

    displayName?: string;

    createdAt?: string | null;

    updatedAt?: string | null;
}

export interface CreateTariffVersionPayload {
    year: number;

    version: number;

    name: string;

    description?: string | null;

    effective_from: string;

    effective_to?: string | null;

    isActive?: boolean;
}

export interface UpdateTariffVersionPayload {
    year?: number;

    version?: number;

    name?: string;

    description?: string | null;

    effective_from?: string;

    effective_to?: string | null;

    isActive?: boolean;
}

export interface CurrentActiveTariffSummary {
    message: string;
}

export interface DuplicateTariffVersionPayload {
    year: number;

    name: string;

    effective_from: string;

    effective_to: string | null;
}

export interface DuplicateTariffVersionVariables {
    id: string;

    data: DuplicateTariffVersionPayload;
}
