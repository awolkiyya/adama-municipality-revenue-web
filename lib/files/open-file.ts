import { api } from "../api";

export type OpenableFile = {
    id: string;
    uuid?: string;
    url?: string | null;
};

export async function openFileInNewTab(
    file: OpenableFile,
): Promise<void> {

    // =====================================================
    // OPEN WINDOW IMMEDIATELY
    // =====================================================

    const newTab = window.open(
        "",
        "_blank",
    );

    if (!newTab) {
        throw new Error(
            "The browser blocked the new tab. Please allow pop-ups for this site.",
        );
    }

    // Prevent the opened page from having access to the opener.
    newTab.opener = null;

    try {

        // =================================================
        // PUBLIC FILE
        // =================================================

        if (file.url) {

            newTab.location.href =
                file.url;

            return;
        }


        // =================================================
        // PRIVATE FILE
        // =================================================

        const reference =
            file.uuid ?? file.id;


        const response =
            await api.get<Blob>(
                `/private-file/${reference}/url`,
                {
                    responseType: "blob",
                },
            );


        const blob =
            response.data;


        if (!(blob instanceof Blob)) {

            throw new Error(
                "Invalid file response.",
            );
        }


        // =================================================
        // CREATE BLOB URL
        // =================================================

        const blobUrl =
            URL.createObjectURL(blob);


        // =================================================
        // OPEN FILE
        // =================================================

        newTab.location.href =
            blobUrl;


        // =================================================
        // CLEANUP
        // =================================================

        setTimeout(() => {

            URL.revokeObjectURL(
                blobUrl,
            );

        }, 60_000);

    } catch (error) {

        console.error(
            "Failed to open private file:",
            error,
        );

        newTab.close();

        throw error;
    }
}