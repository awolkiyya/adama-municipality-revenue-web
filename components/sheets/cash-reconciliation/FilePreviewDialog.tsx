
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Maximize2,
  Trash2,
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

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                              */
/* -------------------------------------------------------------------------- */

export type FileKind = "pdf" | "image" | "spreadsheet" | "document";

const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const SPREADSHEET_EXTENSIONS = ["xls", "xlsx", "csv"];
const CSV_PREVIEW_ROWS = 200;
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

export function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf(".");

  return index <= 0
    ? ""
    : fileName.slice(index + 1).toLowerCase();
}

export function getFileKind(file: File): FileKind {
  const extension = getFileExtension(file.name);

  if (file.type === "application/pdf" || extension === "pdf") {
    return "pdf";
  }

  if (
    file.type.startsWith("image/") ||
    IMAGE_EXTENSIONS.includes(extension)
  ) {
    return "image";
  }

  if (SPREADSHEET_EXTENSIONS.includes(extension)) {
    return "spreadsheet";
  }

  return "document";
}

export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

export function downloadLocalFile(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = file.name;

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export const KIND_STYLES: Record<
  FileKind,
  { tile: string; badge: string; label: string }
> = {
  pdf: {
    tile: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400",
    badge:
      "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400",
    label: "PDF",
  },

  image: {
    tile:
      "bg-violet-500/10 text-violet-600 ring-violet-500/20 dark:text-violet-400",
    badge:
      "border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-400",
    label: "Image",
  },

  spreadsheet: {
    tile:
      "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
    badge:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    label: "Sheet",
  },

  document: {
    tile:
      "bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-400",
    badge:
      "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
    label: "Document",
  },
};

export function FileTile({
  kind,
  className,
}: {
  kind: FileKind;
  className?: string;
}) {
  const Icon =
    kind === "image"
      ? FileImage
      : kind === "spreadsheet"
        ? FileSpreadsheet
        : FileText;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset",
        KIND_STYLES[kind].tile,
        className,
      )}
    >
      <Icon className="size-1/2" />
    </div>
  );
}

function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function parseCsv(text: string, maxRows: number): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (
    let i = 0;
    i < text.length && rows.length < maxRows;
    i++
  ) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }

      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") {
        i++;
      }

      row.push(cell);
      rows.push(row);

      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if ((cell || row.length) && rows.length < maxRows) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

/* -------------------------------------------------------------------------- */
/* Object URL store                                                            */
/* -------------------------------------------------------------------------- */

type ObjectUrlEntry = {
  url: string;
  listeners: Set<() => void>;
};

const objectUrlStore = new Map<File, ObjectUrlEntry>();

function subscribeToObjectUrl(
  file: File,
  callback: () => void,
): () => void {
  let entry = objectUrlStore.get(file);

  if (!entry) {
    entry = {
      url: URL.createObjectURL(file),
      listeners: new Set(),
    };

    objectUrlStore.set(file, entry);
  }

  entry.listeners.add(callback);

  // Notify React that the object URL is now available.
  callback();

  return () => {
    const currentEntry = objectUrlStore.get(file);

    if (!currentEntry) return;

    currentEntry.listeners.delete(callback);

    // Revoke the URL when the last subscriber is removed.
    if (currentEntry.listeners.size === 0) {
      URL.revokeObjectURL(currentEntry.url);
      objectUrlStore.delete(file);
    }
  };
}

function getObjectUrlSnapshot(file: File): string | null {
  return objectUrlStore.get(file)?.url ?? null;
}

function getObjectUrlServerSnapshot(): null {
  return null;
}

function useObjectUrl(file: File | null): string | null {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (!file) return () => {};

      return subscribeToObjectUrl(file, callback);
    },
    [file],
  );

  const getSnapshot = useCallback(
    () => (file ? getObjectUrlSnapshot(file) : null),
    [file],
  );

  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    getObjectUrlServerSnapshot,
  );
}

/* -------------------------------------------------------------------------- */
/* Thumbnail                                                                   */
/* -------------------------------------------------------------------------- */

function Thumb({
  file,
  className,
}: {
  file: File;
  className?: string;
}) {
  const kind = getFileKind(file);
  const url = useObjectUrl(kind === "image" ? file : null);

  if (kind === "image" && url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={cn(
          "shrink-0 rounded-lg object-cover ring-1 ring-border",
          className,
        )}
      />
    );
  }

  return <FileTile kind={kind} className={className} />;
}

/* -------------------------------------------------------------------------- */
/* Viewers                                                                     */
/* -------------------------------------------------------------------------- */

function ViewerFallback({
  file,
  title,
  message,
}: {
  file: File;
  title: string;
  message: string;
}) {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center p-6">
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <FileTile kind={getFileKind(file)} className="size-16" />

        <div className="space-y-1.5">
          <h3 className="text-base font-semibold">{title}</h3>

          <p className="text-sm leading-relaxed text-muted-foreground">
            {message}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => downloadLocalFile(file)}
        >
          <Download className="mr-2 size-4" />
          Download file
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Image viewer                                                                */
/* -------------------------------------------------------------------------- */

function ImageViewer({
  file,
  url,
  zoom,
  onWheelZoom,
}: {
  file: File;
  url: string | null;
  zoom: number | null;
  onWheelZoom: (direction: 1 | -1) => void;
}) {
  const [natural, setNatural] = useState<{
    w: number;
    h: number;
  } | null>(null);

  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <ViewerFallback
        file={file}
        title="This image can't be displayed"
        message="The file may be corrupted or in an unsupported encoding. You can still download it."
      />
    );
  }

  return (
    <div
      className={cn(
        "relative flex min-h-full p-4 sm:p-8",
        zoom === null
          ? "items-center justify-center"
          : "w-max min-w-full",
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

      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={file.name}
          onLoad={(event) =>
            setNatural({
              w: event.currentTarget.naturalWidth,
              h: event.currentTarget.naturalHeight,
            })
          }
          onError={() => setFailed(true)}
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
            "m-auto rounded-md bg-white shadow-lg ring-1 ring-border transition-opacity",
            natural ? "opacity-100" : "opacity-0",
            zoom === null && "max-h-full max-w-full object-contain",
          )}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* PDF viewer                                                                  */
/* -------------------------------------------------------------------------- */

function PdfViewer({
  file,
  url,
}: {
  file: File;
  url: string | null;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative h-full min-h-[360px] bg-neutral-200 dark:bg-neutral-800">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      )}

      {url && (
        <iframe
          src={url}
          title={`Preview of ${file.name}`}
          onLoad={() => setLoaded(true)}
          className="h-full w-full border-0 bg-white"
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* CSV viewer                                                                  */
/* -------------------------------------------------------------------------- */

function CsvViewer({ file }: { file: File }) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    file
      .slice(0, 1024 * 1024)
      .text()
      .then((text) => {
        if (!cancelled) {
          setRows(parseCsv(text, CSV_PREVIEW_ROWS));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  if (failed) {
    return (
      <ViewerFallback
        file={file}
        title="Couldn't read this file"
        message="The CSV could not be opened for preview. Download it to inspect the contents."
      />
    );
  }

  if (!rows) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <ViewerFallback
        file={file}
        title="This file is empty"
        message="There is nothing to show. Check that you selected the right file."
      />
    );
  }

  const [header, ...body] = rows;
  const truncated = rows.length >= CSV_PREVIEW_ROWS;

  return (
    <div className="p-4 sm:p-6">
      <div className="overflow-auto rounded-xl border bg-background shadow-sm">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 z-10 bg-muted">
            <tr>
              <th className="w-10 border-b border-r px-2 py-2 text-right font-normal text-muted-foreground">
                #
              </th>

              {header.map((cell, index) => (
                <th
                  key={index}
                  className="whitespace-nowrap border-b px-3 py-2 font-semibold"
                >
                  {cell}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {body.map((row, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-muted/30">
                <td className="border-r px-2 py-1.5 text-right tabular-nums text-muted-foreground">
                  {rowIndex + 1}
                </td>

                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="whitespace-nowrap border-b px-3 py-1.5"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {truncated
          ? `Showing the first ${CSV_PREVIEW_ROWS - 1} rows. Download the file to see everything.`
          : `${body.length} ${body.length === 1 ? "row" : "rows"}`}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Dialog types                                                                */
/* -------------------------------------------------------------------------- */

export interface FilePreviewDialogProps {
  files: File[];

  /** Index of the file being previewed, or null when closed. */
  index: number | null;

  onIndexChange: (index: number) => void;
  onClose: () => void;

  /** When provided, a Remove action is shown (with inline confirmation). */
  onRemove?: (index: number) => void;

  disabled?: boolean;

  /** Small status text under the file name. */
  statusLabel?: string;
}

/* -------------------------------------------------------------------------- */
/* Public dialog component                                                     */
/* -------------------------------------------------------------------------- */

export function FilePreviewDialog(
  props: FilePreviewDialogProps,
) {
  const selectedFile =
    props.index !== null
      ? (props.files[props.index] ?? null)
      : null;

  const dialogKey = selectedFile
    ? `${props.index}-${fileKey(selectedFile)}`
    : "closed";

  return (
    <FilePreviewDialogContent
      key={dialogKey}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Internal dialog component                                                   */
/* -------------------------------------------------------------------------- */

function FilePreviewDialogContent({
  files,
  index,
  onIndexChange,
  onClose,
  onRemove,
  disabled = false,
  statusLabel = "Not uploaded yet",
}: FilePreviewDialogProps) {
  const file =
    index !== null
      ? (files[index] ?? null)
      : null;

  const kind = file ? getFileKind(file) : "document";

  const isCsv = file
    ? getFileExtension(file.name) === "csv"
    : false;

  const hasMany = files.length > 1;

  const url = useObjectUrl(
    kind === "image" || kind === "pdf" ? file : null,
  );

  /** null = fit to screen, number = scale factor */
  const [zoom, setZoom] = useState<number | null>(null);

  const [confirmRemove, setConfirmRemove] = useState(false);

  // ==========================================================
  // ZOOM CONTROLS
  // ==========================================================

  const zoomIn = () => {
    setZoom((current) => {
      const base = current ?? 1;

      return (
        ZOOM_STEPS.find((step) => step > base + 0.001) ??
        base
      );
    });
  };

  const zoomOut = () => {
    setZoom((current) => {
      const base = current ?? 1;

      const smaller = [...ZOOM_STEPS]
        .reverse()
        .find((step) => step < base - 0.001);

      return smaller ?? base;
    });
  };

  const wheelZoom = (direction: 1 | -1) => {
    if (direction > 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  // ==========================================================
  // KEYBOARD SHORTCUTS
  // ==========================================================

  useEffect(() => {
    if (index === null) return;

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

      if (event.key === "ArrowRight") {
        onIndexChange(
          Math.min(index! + 1, files.length - 1),
        );
      } else if (event.key === "ArrowLeft") {
        onIndexChange(Math.max(index! - 1, 0));
      } else if (
        kind === "image" &&
        (event.key === "+" || event.key === "=")
      ) {
        zoomIn();
      } else if (
        kind === "image" &&
        event.key === "-"
      ) {
        zoomOut();
      } else if (
        kind === "image" &&
        event.key === "0"
      ) {
        setZoom(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    index,
    files.length,
    kind,
    onIndexChange,
  ]);

  // ==========================================================
  // DERIVED VALUES
  // ==========================================================

  const totalSize = useMemo(
    () => files.reduce((sum, item) => sum + item.size, 0),
    [files],
  );

  const extensionLabel = file
    ? getFileExtension(file.name).toUpperCase() ||
      KIND_STYLES[kind].label
    : "";

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <Dialog
      open={file !== null}
      onOpenChange={(value) => {
        if (!value) {
          onClose();
        }
      }}
    >
      <DialogContent className="flex h-[90vh] max-h-[900px] w-[calc(100%-1.5rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:max-w-6xl">
        {file && index !== null && (
          <>
            {/* ------------------------------ Header ------------------------------ */}

            <DialogHeader className="shrink-0 border-b px-4 py-3 pr-12 text-left sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                <Thumb file={file} className="size-10" />

                <div className="min-w-0 flex-1 space-y-0.5">
                  <DialogTitle
                    className="truncate text-base font-semibold leading-tight"
                    title={file.name}
                  >
                    {file.name}
                  </DialogTitle>

                  <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-1.5 py-0 text-[10px] font-semibold",
                        KIND_STYLES[kind].badge,
                      )}
                    >
                      {extensionLabel}
                    </Badge>

                    <span>{formatFileSize(file.size)}</span>

                    {statusLabel && (
                      <span className="text-muted-foreground/70">
                        · {statusLabel}
                      </span>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* ------------------------------ Toolbar ------------------------------ */}

            <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-muted/30 px-3 py-1.5 sm:px-4">
              <div className="flex items-center gap-1">
                {hasMany && (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={index === 0}
                      onClick={() => onIndexChange(index - 1)}
                      aria-label="Previous document"
                      title="Previous (←)"
                    >
                      <ChevronLeft className="size-4" />
                    </Button>

                    <span
                      className="min-w-[3.5rem] text-center text-xs tabular-nums text-muted-foreground"
                      aria-live="polite"
                    >
                      {index + 1} of {files.length}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={index === files.length - 1}
                      onClick={() => onIndexChange(index + 1)}
                      aria-label="Next document"
                      title="Next (→)"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1">
                {kind === "image" && (
                  <div className="mr-1 flex items-center rounded-lg border bg-background p-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={zoomOut}
                      disabled={(zoom ?? 1) <= ZOOM_STEPS[0]}
                      aria-label="Zoom out"
                      title="Zoom out (−)"
                    >
                      <ZoomOut className="size-4" />
                    </Button>

                    <button
                      type="button"
                      onClick={() => setZoom(null)}
                      className="min-w-[3.25rem] rounded-md px-1 text-center text-xs font-medium tabular-nums outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
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
                      className="size-7"
                      onClick={zoomIn}
                      disabled={
                        (zoom ?? 1) >=
                        ZOOM_STEPS[ZOOM_STEPS.length - 1]
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
                      className="size-7"
                      onClick={() => setZoom(null)}
                      aria-label="Fit to screen"
                      title="Fit to screen (0)"
                    >
                      <Maximize2 className="size-3.5" />
                    </Button>
                  </div>
                )}

                {kind === "pdf" && url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    asChild
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 size-4" />
                      Open in new tab
                    </a>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => downloadLocalFile(file)}
                >
                  <Download className="mr-2 size-4" />
                  Download
                </Button>
              </div>
            </div>

            {/* ------------------------------- Body ------------------------------- */}

            <div className="flex min-h-0 flex-1">
              {/* Desktop filmstrip */}

              {hasMany && (
                <aside className="hidden w-60 shrink-0 flex-col border-r bg-background md:flex">
                  <div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground">
                    <span>Selected documents</span>

                    <span className="tabular-nums">
                      {formatFileSize(totalSize)}
                    </span>
                  </div>

                  <ul className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
                    {files.map((item, itemIndex) => {
                      const active = itemIndex === index;

                      return (
                        <li key={fileKey(item)}>
                          <button
                            type="button"
                            onClick={() =>
                              onIndexChange(itemIndex)
                            }
                            aria-current={active}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg border border-transparent p-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                              active
                                ? "border-primary/30 bg-primary/5"
                                : "hover:bg-muted/60",
                            )}
                          >
                            <Thumb
                              file={item}
                              className="size-10"
                            />

                            <span className="min-w-0 flex-1">
                              <span
                                className={cn(
                                  "block truncate text-xs",
                                  active
                                    ? "font-semibold"
                                    : "font-medium",
                                )}
                                title={item.name}
                              >
                                {item.name}
                              </span>

                              <span className="block text-[11px] text-muted-foreground">
                                {formatFileSize(item.size)}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </aside>
              )}

              {/* Viewer */}

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 overflow-auto bg-muted/50">
                  {kind === "image" ? (
                    <ImageViewer
                      file={file}
                      url={url}
                      zoom={zoom}
                      onWheelZoom={wheelZoom}
                    />
                  ) : kind === "pdf" ? (
                    <PdfViewer
                      file={file}
                      url={url}
                    />
                  ) : isCsv ? (
                    <CsvViewer file={file} />
                  ) : (
                    <ViewerFallback
                      file={file}
                      title="No preview for this format"
                      message={`Browsers can't display ${extensionLabel || "this"} files directly. Download it to open it in the right app.`}
                    />
                  )}
                </div>

                {/* Mobile filmstrip */}

                {hasMany && (
                  <div className="flex shrink-0 gap-2 overflow-x-auto border-t bg-background px-3 py-2 md:hidden">
                    {files.map((item, itemIndex) => {
                      const active = itemIndex === index;

                      return (
                        <button
                          key={fileKey(item)}
                          type="button"
                          onClick={() =>
                            onIndexChange(itemIndex)
                          }
                          aria-label={`Preview ${item.name}`}
                          aria-current={active}
                          className={cn(
                            "rounded-lg border-2 border-transparent p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            active && "border-primary",
                          )}
                        >
                          <Thumb
                            file={item}
                            className="size-11"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ------------------------------ Footer ------------------------------ */}

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t bg-background px-4 py-3 sm:px-5">
              <div className="min-h-8">
                {onRemove &&
                  (confirmRemove ? (
                    <div
                      role="alertdialog"
                      aria-label="Confirm removal"
                      className="flex items-center gap-2 text-sm"
                    >
                      <AlertCircle className="size-4 text-destructive" />

                      <span className="text-muted-foreground">
                        Remove this file?
                      </span>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={disabled}
                        onClick={() => {
                          setConfirmRemove(false);
                          onRemove(index);
                        }}
                      >
                        Remove
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmRemove(false)}
                      >
                        Keep
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      disabled={disabled}
                      onClick={() => setConfirmRemove(true)}
                    >
                      <Trash2 className="mr-2 size-4" />
                      Remove from selection
                    </Button>
                  ))}
              </div>

              <div className="flex items-center gap-3">
                <p className="hidden text-xs text-muted-foreground lg:block">
                  {hasMany ? "← → switch files" : null}
                  {hasMany && kind === "image" ? " · " : null}
                  {kind === "image"
                    ? "+ − 0 zoom · Ctrl + scroll"
                    : null}
                </p>

                <Button
                  type="button"
                  size="sm"
                  onClick={onClose}
                >
                  Done
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
