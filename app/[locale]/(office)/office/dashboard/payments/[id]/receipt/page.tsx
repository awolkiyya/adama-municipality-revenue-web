
"use client";

import React, { useEffect, useState } from "react";

import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Minus,
  Plus,
  Printer,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";

import {
  Document,
  Page,
  pdfjs,
} from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

import { Button } from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import type { PaymentDetail } from "@/types/payment";

import {
  useDownloadPaymentReceiptPdf,
  usePayment,
  usePaymentReceipt,
  useStreamPaymentReceiptPdf,
} from "@/hooks/payment/payment.hook";

/*
|--------------------------------------------------------------------------
| PDF.js Worker
|--------------------------------------------------------------------------
*/

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/*
|--------------------------------------------------------------------------
| Error State
|--------------------------------------------------------------------------
*/

function ErrorState({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl items-center justify-center px-4">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center px-6 py-10 text-center">
          <div className="mb-4 rounded-full bg-muted p-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>

          <h1 className="text-lg font-semibold">
            {title}
          </h1>

          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {description}
          </p>

          <Button
            className="mt-6"
            variant="outline"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Loading State
|--------------------------------------------------------------------------
*/

function LoadingState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />

        <p className="text-sm">
          {message}
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| PDF Blob Helpers
|--------------------------------------------------------------------------
*/

function normalizePdfBlob(blob: Blob): Blob {
  if (!blob || blob.size === 0) {
    throw new Error("The generated PDF is empty.");
  }

  if (blob.type === "application/pdf") {
    return blob;
  }

  return new Blob([blob], {
    type: "application/pdf",
  });
}

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export default function PaymentReceiptPage() {
  const params = useParams();
  const router = useRouter();

  /*
  |--------------------------------------------------------------------------
  | Route Parameters
  |--------------------------------------------------------------------------
  */

  const locale = String(params.locale ?? "or");

  const paymentId = String(
    params.paymentId ??
      params.id ??
      "",
  );

  /*
  |--------------------------------------------------------------------------
  | Payment
  |--------------------------------------------------------------------------
  */

  const paymentQuery = usePayment(paymentId);

  const payment = paymentQuery.data?.data as
    | PaymentDetail
    | undefined;

  const isCompleted = payment?.status === "COMPLETED";

  /*
  |--------------------------------------------------------------------------
  | Receipt
  |--------------------------------------------------------------------------
  */

  const receiptQuery = usePaymentReceipt(
    paymentId,
    Boolean(paymentId) &&
      isCompleted &&
      !payment?.receipt,
  );

  const receipt =
    payment?.receipt ??
    receiptQuery.data?.data ??
    null;

  /*
  |--------------------------------------------------------------------------
  | PDF Mutations
  |--------------------------------------------------------------------------
  */

  const streamReceiptPdf = useStreamPaymentReceiptPdf();

  const downloadReceiptPdf = useDownloadPaymentReceiptPdf();

  /*
  |--------------------------------------------------------------------------
  | PDF State
  |--------------------------------------------------------------------------
  */

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [pdfError, setPdfError] = useState<string | null>(null);

  const [numPages, setNumPages] = useState<number>(0);

  const [pageNumber, setPageNumber] = useState<number>(1);

  const [scale, setScale] = useState<number>(1);

  const [reloadKey, setReloadKey] = useState<number>(0);

  const isOpeningPdf = streamReceiptPdf.isPending;

  const isDownloading = downloadReceiptPdf.isPending;

  /*
  |--------------------------------------------------------------------------
  | Cleanup PDF URL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  /*
  |--------------------------------------------------------------------------
  | Navigation
  |--------------------------------------------------------------------------
  */

  const goToPayment = () => {
    router.push(
      `/${locale}/office/dashboard/payments/${paymentId}`,
    );
  };

  const goToPayments = () => {
    router.push(
      `/${locale}/office/dashboard/payments`,
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Automatically Generate PDF
  |--------------------------------------------------------------------------
  |
  | The request is initiated by the effect.
  | React state is updated only after the asynchronous request completes.
  |
  */

  useEffect(() => {
    if (
      !payment?.id ||
      !receipt ||
      !isCompleted ||
      pdfUrl
    ) {
      return;
    }

    let cancelled = false;

    const generatePdf = async () => {
      try {
        const blob = await streamReceiptPdf.mutateAsync(
          payment.id,
        );

        const pdfBlob = normalizePdfBlob(blob);

        const url = URL.createObjectURL(pdfBlob);

        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }

        setPdfError(null);
        setPageNumber(1);
        setNumPages(0);
        setScale(1);
        setPdfUrl(url);
      } catch (error) {
        console.error(
          "Failed to load payment receipt PDF:",
          error,
        );

        if (!cancelled) {
          setPdfError(
            "The official payment receipt could not be generated. Please try again.",
          );
        }
      }
    };

    void generatePdf();

    return () => {
      cancelled = true;
    };
  }, [
    payment?.id,
    receipt,
    isCompleted,
    pdfUrl,
    reloadKey,
    streamReceiptPdf.mutateAsync,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Reload PDF
  |--------------------------------------------------------------------------
  */

  const handleReload = () => {
    setPdfUrl(null);
    setPdfError(null);
    setPageNumber(1);
    setNumPages(0);
    setScale(1);

    setReloadKey((current) => current + 1);
  };

  /*
  |--------------------------------------------------------------------------
  | PDF Loaded
  |--------------------------------------------------------------------------
  */

  const handleDocumentLoadSuccess = ({
    numPages: totalPages,
  }: {
    numPages: number;
  }) => {
    setNumPages(totalPages);
    setPageNumber(1);
  };

  /*
  |--------------------------------------------------------------------------
  | PDF Load Error
  |--------------------------------------------------------------------------
  */

  const handleDocumentLoadError = (error: Error) => {
    console.error(
      "Failed to render payment receipt PDF:",
      error,
    );

    setPdfError(
      "The generated receipt PDF could not be displayed.",
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Previous Page
  |--------------------------------------------------------------------------
  */

  const handlePreviousPage = () => {
    setPageNumber((current) =>
      Math.max(1, current - 1),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Next Page
  |--------------------------------------------------------------------------
  */

  const handleNextPage = () => {
    setPageNumber((current) =>
      Math.min(numPages || 1, current + 1),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Zoom Out
  |--------------------------------------------------------------------------
  */

  const handleZoomOut = () => {
    setScale((current) =>
      Math.max(
        0.6,
        Number((current - 0.1).toFixed(1)),
      ),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Zoom In
  |--------------------------------------------------------------------------
  */

  const handleZoomIn = () => {
    setScale((current) =>
      Math.min(
        2,
        Number((current + 0.1).toFixed(1)),
      ),
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Download PDF
  |--------------------------------------------------------------------------
  */

  const handleDownload = async () => {
    if (
      !payment?.id ||
      !receipt ||
      downloadReceiptPdf.isPending
    ) {
      return;
    }

    try {
      const blob = await downloadReceiptPdf.mutateAsync(
        payment.id,
      );

      const pdfBlob = normalizePdfBlob(blob);

      const url = URL.createObjectURL(pdfBlob);

      const anchor = document.createElement("a");

      anchor.href = url;

      anchor.download =
        `payment-receipt-${receipt.receipt_number}.pdf`;

      document.body.appendChild(anchor);

      anchor.click();

      anchor.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error(
        "Failed to download payment receipt PDF:",
        error,
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Print PDF
  |--------------------------------------------------------------------------
  */

  const handlePrint = () => {
    if (!pdfUrl) {
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=700",
    );

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            html,
            body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
            }

            embed {
              width: 100%;
              height: 100%;
              border: 0;
            }
          </style>
        </head>

        <body>
          <embed
            src="${pdfUrl}"
            type="application/pdf"
          />
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  /*
  |--------------------------------------------------------------------------
  | Loading Payment
  |--------------------------------------------------------------------------
  */

  if (paymentQuery.isLoading) {
    return (
      <LoadingState message="Loading payment receipt..." />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Payment Error
  |--------------------------------------------------------------------------
  */

  if (paymentQuery.isError || !payment) {
    return (
      <ErrorState
        title="Payment not found"
        description="The requested payment could not be found or is no longer available."
        onBack={goToPayments}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Payment Not Completed
  |--------------------------------------------------------------------------
  */

  if (!isCompleted) {
    return (
      <ErrorState
        title="Receipt not available"
        description="An official receipt is available only after the payment has been completed."
        onBack={goToPayment}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Receipt Loading
  |--------------------------------------------------------------------------
  */

  if (!payment.receipt && receiptQuery.isLoading) {
    return (
      <LoadingState message="Loading official receipt..." />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Receipt Error
  |--------------------------------------------------------------------------
  */

  if (receiptQuery.isError || !receipt) {
    return (
      <ErrorState
        title="Receipt unavailable"
        description="This payment is completed, but its official receipt could not be retrieved."
        onBack={goToPayment}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      {/* ================================================================ */}
      {/* TOOLBAR                                                          */}
      {/* ================================================================ */}

      <header className="no-print sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Left */}

          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPayment}
              disabled={isDownloading || isOpeningPdf}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <div className="hidden h-5 w-px bg-border sm:block" />

            <div className="hidden min-w-0 sm:block">
              <p className="text-sm font-semibold">
                Payment Receipt
              </p>

              <p className="truncate text-xs text-muted-foreground">
                {receipt.receipt_number}
              </p>
            </div>
          </div>

          {/* Actions */}

          <div className="flex shrink-0 items-center gap-2">
            {/* Refresh */}

            <Button
              variant="outline"
              size="sm"
              onClick={handleReload}
              disabled={isOpeningPdf || isDownloading}
            >
              {isOpeningPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}

              <span className="hidden sm:inline">
                {isOpeningPdf ? "Generating..." : "Refresh"}
              </span>

              <span className="sm:hidden">
                {isOpeningPdf ? "..." : "Refresh"}
              </span>
            </Button>

            {/* Page Controls */}

            {pdfUrl && (
              <div className="hidden items-center gap-1 md:flex">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousPage}
                  disabled={pageNumber <= 1}
                  title="Previous page"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <div className="min-w-[70px] text-center text-xs text-muted-foreground">
                  {pageNumber}
                  {numPages > 0 && <> / {numPages}</>}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={
                    numPages === 0 ||
                    pageNumber >= numPages
                  }
                  title="Next page"
                >
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            )}

            {/* Zoom */}

            {pdfUrl && (
              <div className="hidden items-center gap-1 lg:flex">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={scale <= 0.6}
                  title="Zoom out"
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="min-w-[48px] text-center text-xs text-muted-foreground">
                  {Math.round(scale * 100)}%
                </span>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={scale >= 2}
                  title="Zoom in"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Print */}

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={
                !pdfUrl ||
                isOpeningPdf ||
                isDownloading
              }
            >
              <Printer className="mr-2 h-4 w-4" />

              <span className="hidden sm:inline">
                Print
              </span>
            </Button>

            {/* Download */}

            <Button
              size="sm"
              onClick={handleDownload}
              disabled={
                !receipt ||
                isDownloading ||
                isOpeningPdf
              }
            >
              {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}

              <span className="hidden sm:inline">
                {isDownloading
                  ? "Downloading..."
                  : "Download PDF"}
              </span>

              <span className="sm:hidden">
                {isDownloading ? "..." : "Download"}
              </span>
            </Button>
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* PDF AREA                                                         */}
      {/* ================================================================ */}

      <main className="flex flex-1 justify-center overflow-auto px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex w-full max-w-6xl justify-center">
          <div className="relative min-h-[calc(100vh-105px)] w-full overflow-auto rounded-lg border bg-muted shadow-sm">
            {/* Loading */}

            {isOpeningPdf && !pdfUrl && (
              <div className="flex min-h-[75vh] flex-col items-center justify-center gap-4">
                <div className="rounded-full border bg-background p-3 shadow-sm">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>

                <div className="text-center">
                  <p className="text-sm font-medium">
                    Generating official receipt
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Preparing the PDF from the municipal
                    revenue system...
                  </p>
                </div>
              </div>
            )}

            {/* Error */}

            {pdfError && !pdfUrl && !isOpeningPdf && (
              <div className="flex min-h-[75vh] flex-col items-center justify-center px-6 text-center">
                <div className="rounded-full bg-muted p-3">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>

                <h2 className="mt-4 text-base font-semibold">
                  Unable to display receipt
                </h2>

                <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                  {pdfError}
                </p>

                <Button
                  className="mt-5"
                  variant="outline"
                  onClick={handleReload}
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* PDF.js Document */}

            {pdfUrl && (
              <div className="flex min-h-[75vh] justify-center overflow-auto p-4 sm:p-6">
                <Document
                  file={pdfUrl}
                  onLoadSuccess={handleDocumentLoadSuccess}
                  onLoadError={handleDocumentLoadError}
                  loading={
                    <div className="flex min-h-[70vh] items-center justify-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />

                        <p className="text-sm">
                          Rendering receipt...
                        </p>
                      </div>
                    </div>
                  }
                  error={
                    <div className="flex min-h-[70vh] items-center justify-center px-6 text-center">
                      <div>
                        <FileText className="mx-auto h-8 w-8 text-muted-foreground" />

                        <p className="mt-3 text-sm font-medium">
                          Unable to render receipt
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          Please refresh and try again.
                        </p>
                      </div>
                    </div>
                  }
                >
                  <div className="overflow-hidden rounded-sm bg-white shadow-xl">
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer
                      renderAnnotationLayer
                      loading={
                        <div className="flex min-h-[800px] items-center justify-center bg-white">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                      }
                    />
                  </div>
                </Document>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
