
"use client";

import { useCallback, useEffect, useState } from "react";

import {
  AlertCircle,
  Download,
  ExternalLink,
  Loader2,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

import { usePrivateImage } from "@/hooks/usePrivateImage";

import { fetchPrivateImage } from "@/services/user.service";

import {
  FileTile,
  KIND_STYLES,
  getFileExtension,
  type FileKind,
} from "./FilePreviewDialog";

/* -------------------------------------------------------------------------- */
/* Configuration                                                              */
/* -------------------------------------------------------------------------- */

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

export type PrivateFilePreviewDialogProps = {
  open: boolean;
  path: string | null;
  fileName: string;
  mimeType?: string | null;
  onClose: () => void;
  onDownload: () => void;
};

/* -------------------------------------------------------------------------- */
/* State panels                                                               */
/* -------------------------------------------------------------------------- */

function LoadingPanel() {
  return (
    <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="size-6 animate-spin" />

      <p className="text-sm">Loading document...</p>
    </div>
  );
}

function MessagePanel({
  kind,
  title,
  message,
  tone = "neutral",
  onDownload,
  downloadLabel = "Download file",
}: {
  kind: FileKind;
  title: string;
  message: string;
  tone?: "neutral" | "error";
  onDownload: () => void;
  downloadLabel?: string;
}) {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border bg-background p-6 text-center shadow-sm sm:p-8">
        {tone === "error" ? (
          <div className="flex size-14 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20 sm:size-16">
            <AlertCircle className="size-7" />
          </div>
        ) : (
          <FileTile kind={kind} className="size-14 sm:size-16" />
        )}

        <div className="space-y-1.5">
          <h3 className="text-base font-semibold">{title}</h3>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={onDownload}
        >
          <Download className="mr-2 size-4" />
          {downloadLabel}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Image viewer                                                               */
/* -------------------------------------------------------------------------- */

function PrivateImageViewer({
  url,
  fileName,
  zoom,
  onWheelZoom,
  onToggleZoom,
  onError,
}: {
  url: string;
  fileName: string;
  zoom: number | null;
  onWheelZoom: (direction: 1 | -1) => void;
  onToggleZoom: () => void;
  onError: () => void;
}) {
  const [natural, setNatural] = useState<{
    w: number;
    h: number;
  } | null>(null);

  return (
    <div
      className={cn(
        "relative flex min-h-full p-3 sm:p-8",
        zoom === null
          ? "h-full items-center justify-center"
          : "w-max min-w-full"
      )}
      onWheel={(event) => {
        if (!event.ctrlKey) return;

        event.preventDefault();

        onWheelZoom(event.deltaY < 0 ? 1 : -1);
      }}
    >
      {!natural && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={fileName}
        onLoad={(event) =>
          setNatural({
            w: event.currentTarget.naturalWidth,
            h: event.currentTarget.naturalHeight,
          })
        }
        onError={onError}
        onDoubleClick={onToggleZoom}
        draggable={false}
        style={
          zoom !== null && natural
            ? {
                width: natural.w * zoom,
                maxWidth: "none",
              }
            : undefined
        }
        className={cn(
          "m-auto select-none rounded-md bg-white shadow-lg ring-1 ring-border transition-opacity",
          natural ? "opacity-100" : "opacity-0",
          zoom === null
            ? "max-h-full max-w-full cursor-zoom-in object-contain"
            : "cursor-zoom-out"
        )}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PDF viewer                                                                 */
/* -------------------------------------------------------------------------- */

function PrivatePdfViewer({
  url,
  fileName,
}: {
  url: string;
  fileName: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative flex h-full min-h-[320px] flex-col bg-neutral-200 dark:bg-neutral-800">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-background px-3 py-1.5 text-xs text-muted-foreground sm:hidden">
        <span className="truncate">Preview not loading?</span>

        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
        >
          Open in new tab

          <ExternalLink className="size-3" />
        </a>
      </div>

      <div className="relative min-h-0 flex-1">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}

        <iframe
          src={url}
          title={`Preview of ${fileName}`}
          onLoad={() => setLoaded(true)}
          className="h-full w-full border-0 bg-white"
        />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog wrapper                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Remount the internal dialog state whenever the selected file or open state
 * changes. This resets zoom, loading, and error state without reset effects.
 */
export default function PrivateFilePreviewDialog(
  props: PrivateFilePreviewDialogProps
) {
  const instanceKey = [
    props.open ? "open" : "closed",
    props.path ?? "no-path",
    props.fileName,
  ].join(":");

  return (
    <PrivateFilePreviewDialogContent
      key={instanceKey}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog content                                                             */
/* -------------------------------------------------------------------------- */

function PrivateFilePreviewDialogContent({
  open,
  path,
  fileName,
  mimeType,
  onClose,
  onDownload,
}: PrivateFilePreviewDialogProps) {
  const extension = getFileExtension(fileName);

  const normalizedMimeType = mimeType?.toLowerCase() ?? "";

  const isImage =
    IMAGE_EXTENSIONS.includes(extension);

  const isPdf =
    normalizedMimeType === "application/pdf" || extension === "pdf";

  const kind: FileKind = isPdf
    ? "pdf"
    : isImage
      ? "image"
      : "document";

  const extensionLabel =
    extension.toUpperCase() || KIND_STYLES[kind].label;

  /* ---------------------------------------------------------------------- */
  /* Private image loading                                                  */
  /* ---------------------------------------------------------------------- */

  const {
    url: imageUrl,
    loading: imageLoading,
  } = usePrivateImage(isImage && open ? path : null);

  /* ---------------------------------------------------------------------- */
  /* Private PDF loading                                                    */
  /* ---------------------------------------------------------------------- */

  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  const [documentLoading, setDocumentLoading] = useState(
    open && Boolean(path) && isPdf
  );

  const [failed, setFailed] = useState(false);

  /**
   * Fetch authenticated PDF content.
   *
   * The object URL is revoked when:
   * - The dialog closes.
   * - The selected file changes.
   * - The component unmounts.
   * - The request finishes after the component has unmounted.
   */
  useEffect(() => {
    if (!open || !path || !isPdf) {
      return;
    }

    let active = true;
    let objectUrl: string | null = null;

    fetchPrivateImage(path)
      .then((url) => {
        objectUrl = url;

        if (!active) {
          URL.revokeObjectURL(url);
          return;
        }

        setDocumentUrl(url);
      })
      .catch(() => {
        if (active) {
          setFailed(true);
        }
      })
      .finally(() => {
        if (active) {
          setDocumentLoading(false);
        }
      });

    return () => {
      active = false;

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
    };
  }, [open, path, isPdf]);

  /* ---------------------------------------------------------------------- */
  /* Viewer state                                                           */
  /* ---------------------------------------------------------------------- */

  /**
   * null = fit to screen
   * number = zoom scale factor
   *
   * This state resets automatically because the dialog content is keyed
   * by the selected file and open state.
   */
  const [zoom, setZoom] = useState<number | null>(null);

  const url = isImage ? imageUrl : documentUrl;

  const loading = isImage ? imageLoading : documentLoading;

  /* ---------------------------------------------------------------------- */
  /* Zoom controls                                                          */
  /* ---------------------------------------------------------------------- */

  const zoomIn = useCallback(() => {
    setZoom((current) => {
      const base = current ?? 1;

      return ZOOM_STEPS.find((step) => step > base + 0.001) ?? base;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((current) => {
      const base = current ?? 1;

      const smaller = [...ZOOM_STEPS]
        .reverse()
        .find((step) => step < base - 0.001);

      return smaller ?? base;
    });
  }, []);

  const toggleZoom = useCallback(() => {
    setZoom((current) => (current === null ? 2 : null));
  }, []);

  const wheelZoom = useCallback(
    (direction: 1 | -1) => {
      if (direction > 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    },
    [zoomIn, zoomOut]
  );

  /* ---------------------------------------------------------------------- */
  /* Keyboard shortcuts                                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!open || !isImage) return;

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;

      if (
        target &&
        ["INPUT", "TEXTAREA"].includes(target.tagName)
      ) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      if (event.key === "+" || event.key === "=") {
        zoomIn();
      } else if (event.key === "-") {
        zoomOut();
      } else if (event.key === "0") {
        setZoom(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, isImage, zoomIn, zoomOut]);

  /* ---------------------------------------------------------------------- */
  /* Preview availability                                                   */
  /* ---------------------------------------------------------------------- */

  const canOpenInTab =
    Boolean(url) && !failed && (isPdf || isImage);

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
        }
      }}
    >
      <DialogContent
        className={cn(
          "flex w-full max-w-none flex-col gap-0 overflow-hidden p-0",
          "h-[100dvh] max-h-none rounded-none border-0",
          "sm:h-[90vh] sm:max-h-[900px] sm:w-[calc(100%-2rem)] sm:max-w-5xl sm:rounded-xl sm:border"
        )}
      >
        {/* ---------------------------------------------------------------- */}
        {/* Header                                                           */}
        {/* ---------------------------------------------------------------- */}

        <DialogHeader className="shrink-0 border-b bg-background px-4 py-3 pr-12 text-left sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <FileTile kind={kind} className="size-10 sm:size-11" />

            <div className="min-w-0 flex-1 space-y-1">
              <DialogTitle
                className="truncate text-sm font-semibold leading-tight sm:text-base"
                title={fileName}
              >
                {fileName}
              </DialogTitle>

              <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                <Badge
                  variant="outline"
                  className={cn(
                    "px-1.5 py-0 text-[10px] font-semibold",
                    KIND_STYLES[kind].badge
                  )}
                >
                  {extensionLabel}
                </Badge>

                <span className="text-muted-foreground/70">
                  Supporting evidence document
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ---------------------------------------------------------------- */}
        {/* Toolbar                                                          */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-muted/30 px-2 py-1.5 sm:px-4">
          <div className="flex min-w-0 items-center">
            {isImage && !failed ? (
              <div className="flex items-center rounded-lg border bg-background p-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 sm:size-7"
                  onClick={zoomOut}
                  disabled={!url || (zoom ?? 1) <= ZOOM_STEPS[0]}
                  aria-label="Zoom out"
                  title="Zoom out (−)"
                >
                  <ZoomOut className="size-4" />
                </Button>

                <button
                  type="button"
                  onClick={() => setZoom(null)}
                  disabled={!url}
                  className="min-w-[3rem] rounded-md px-1 text-center text-xs font-medium tabular-nums outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                  title="Fit to screen (0)"
                >
                  {zoom === null
                    ? "Fit"
                    : `${Math.round(zoom * 100)}%`}
                </button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 sm:size-7"
                  onClick={zoomIn}
                  disabled={
                    !url ||
                    (zoom ?? 1) >= ZOOM_STEPS[ZOOM_STEPS.length - 1]
                  }
                  aria-label="Zoom in"
                  title="Zoom in (+)"
                >
                  <ZoomIn className="size-4" />
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="hidden size-7 sm:inline-flex"
                  onClick={() => setZoom(null)}
                  disabled={!url}
                  aria-label="Fit to screen"
                  title="Fit to screen (0)"
                >
                  <Maximize2 className="size-3.5" />
                </Button>
              </div>
            ) : (
              <span className="px-2 text-xs text-muted-foreground">
                {isPdf ? "PDF document" : "Document"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {canOpenInTab && url && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-9 sm:hidden"
                  asChild
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={
                      isPdf
                        ? "Open PDF in new tab"
                        : "Open in new tab"
                    }
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex"
                  asChild
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 size-4" />

                    {isPdf ? "Open PDF" : "Open in new tab"}
                  </a>
                </Button>
              </>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 sm:hidden"
              onClick={onDownload}
              aria-label="Download"
            >
              <Download className="size-4" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
              onClick={onDownload}
            >
              <Download className="mr-2 size-4" />
              Download
            </Button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Body                                                             */}
        {/* ---------------------------------------------------------------- */}

        <div className="relative min-h-0 flex-1 bg-muted/50">
          <div className="absolute inset-0 overflow-auto overscroll-contain">
            {loading ? (
              <LoadingPanel />
            ) : failed || !url ? (
              <MessagePanel
                kind={kind}
                tone="error"
                title="Unable to load this document"
                message="Something went wrong while loading the preview. You can still download the original file."
                onDownload={onDownload}
                downloadLabel="Download"
              />
            ) : isImage ? (
              <PrivateImageViewer
                key={url}
                url={url}
                fileName={fileName}
                zoom={zoom}
                onWheelZoom={wheelZoom}
                onToggleZoom={toggleZoom}
                onError={() => setFailed(true)}
              />
            ) : isPdf ? (
              <PrivatePdfViewer
                key={url}
                url={url}
                fileName={fileName}
              />
            ) : (
              <MessagePanel
                kind={kind}
                title="No preview for this format"
                message={`Browsers can't display ${extensionLabel || "this"} files directly. Download it to open it in the right app.`}
                onDownload={onDownload}
                downloadLabel="Download document"
              />
            )}
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="flex shrink-0 items-center justify-between gap-3 border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <p className="hidden text-xs text-muted-foreground lg:block">
            {isImage ? "+ − 0 zoom · Double-click to zoom" : null}
          </p>

          <Button
            type="button"
            size="sm"
            className="w-full sm:ml-auto sm:w-auto sm:min-w-20"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
