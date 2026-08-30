export interface TariffVersion {

    id: string;

    year: number;

    version: number;

    name: string;

    description?: string | null;

    effectiveFrom: string;

    effectiveTo?: string | null;

    isActive: boolean;


    tariffRulesCount?: number;


    isCurrentlyEffective?: boolean;


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