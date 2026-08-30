"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
    openFileInNewTab,
    type OpenableFile,
} from "@/lib/files/open-file";

export function useOpenFile() {

    const [
        openingId,
        setOpeningId,
    ] = useState<string | null>(null);


    const openFile = async (
        file: OpenableFile,
    ) => {

        setOpeningId(file.id);

        try {

            await openFileInNewTab(
                file,
            );

        } catch (error) {

            console.error(
                "Failed to open file:",
                error,
            );

            toast.error(
                error instanceof Error
                    ? error.message
                    : "Could not open this file. Please try again.",
            );

        } finally {

            setOpeningId(null);
        }
    };


    return {
        openFile,

        isOpening: (
            fileId: string,
        ) =>
            openingId === fileId,
    };
}