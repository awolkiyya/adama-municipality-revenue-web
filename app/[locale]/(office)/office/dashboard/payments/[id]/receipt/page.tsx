"use client";

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Minus,
  Plus,
  Printer,
} from "lucide-react";

import {
  useParams,
  useRouter,
} from "next/navigation";

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

import type {
  PaymentDetail,
} from "@/types/payment";

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
|
| Required by react-pdf.
|
*/

pdfjs.GlobalWorkerOptions.workerSrc =
  new URL(
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
| Page
|--------------------------------------------------------------------------
*/

export default function PaymentReceiptPage() {

  const params = useParams();

  const router = useRouter();


  /*
  |--------------------------------------------------------------------------
  | Locale
  |--------------------------------------------------------------------------
  */

  const locale = String(
    params.locale ?? "or",
  );


  /*
  |--------------------------------------------------------------------------
  | Payment ID
  |--------------------------------------------------------------------------
  */

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

  const paymentQuery =
    usePayment(paymentId);

  const payment =
    paymentQuery.data?.data as
      | PaymentDetail
      | undefined;


  /*
  |--------------------------------------------------------------------------
  | Payment Status
  |--------------------------------------------------------------------------
  */

  const isCompleted =
    payment?.status === "COMPLETED";


  /*
  |--------------------------------------------------------------------------
  | Receipt
  |--------------------------------------------------------------------------
  */

  const receiptQuery =
    usePaymentReceipt(
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

  const streamReceiptPdf =
    useStreamPaymentReceiptPdf();

  const downloadReceiptPdf =
    useDownloadPaymentReceiptPdf();


  /*
  |--------------------------------------------------------------------------
  | PDF State
  |--------------------------------------------------------------------------
  */

  const [
    pdfUrl,
    setPdfUrl,
  ] = useState<string | null>(null);

  const [
    pdfLoading,
    setPdfLoading,
  ] = useState(false);

  const [
    pdfError,
    setPdfError,
  ] = useState<string | null>(null);

  const [
    numPages,
    setNumPages,
  ] = useState<number>(0);

  const [
    pageNumber,
    setPageNumber,
  ] = useState<number>(1);

  const [
    scale,
    setScale,
  ] = useState<number>(1);


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
  | Load PDF
  |--------------------------------------------------------------------------
  |
  | Loads the REAL PDF generated by Laravel/DomPDF.
  |
  */

  const loadPdf = useCallback(
    async () => {

      if (
        !payment?.id ||
        !receipt ||
        pdfLoading
      ) {
        return;
      }


      setPdfLoading(true);

      setPdfError(null);


      try {

        /*
        |--------------------------------------------------------------------------
        | Request generated PDF
        |--------------------------------------------------------------------------
        */

        const blob =
          await streamReceiptPdf.mutateAsync(
            payment.id,
          );


        /*
        |--------------------------------------------------------------------------
        | Validate PDF
        |--------------------------------------------------------------------------
        */

        if (
          !blob ||
          blob.size === 0
        ) {
          throw new Error(
            "The generated PDF is empty.",
          );
        }


        /*
        |--------------------------------------------------------------------------
        | Validate MIME type
        |--------------------------------------------------------------------------
        |
        | Some API clients may return application/octet-stream.
        | We still accept the blob if it contains data.
        |
        */

        const pdfBlob =
          blob.type === "application/pdf"
            ? blob
            : new Blob(
                [blob],
                {
                  type: "application/pdf",
                },
              );


        /*
        |--------------------------------------------------------------------------
        | Create Blob URL
        |--------------------------------------------------------------------------
        */

        const url =
          URL.createObjectURL(
            pdfBlob,
          );


        /*
        |--------------------------------------------------------------------------
        | Replace Previous URL
        |--------------------------------------------------------------------------
        */

        setPdfUrl(
          (previousUrl) => {

            if (previousUrl) {
              URL.revokeObjectURL(
                previousUrl,
              );
            }

            return url;

          },
        );


        /*
        |--------------------------------------------------------------------------
        | Reset Viewer
        |--------------------------------------------------------------------------
        */

        setPageNumber(1);

        setNumPages(0);

        setScale(1);

      } catch (error) {

        console.error(
          "Failed to load payment receipt PDF:",
          error,
        );

        setPdfError(
          "The official payment receipt could not be generated. Please try again.",
        );

      } finally {

        setPdfLoading(false);

      }

    },
    [
      payment?.id,
      receipt,
      pdfLoading,
      streamReceiptPdf,
    ],
  );


  /*
  |--------------------------------------------------------------------------
  | Automatically Generate PDF
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (
      !payment?.id ||
      !receipt ||
      !isCompleted ||
      pdfUrl ||
      pdfLoading
    ) {
      return;
    }

    void loadPdf();

  }, [
    payment?.id,
    receipt,
    isCompleted,
    pdfUrl,
    pdfLoading,
    loadPdf,
  ]);


  /*
  |--------------------------------------------------------------------------
  | Reload PDF
  |--------------------------------------------------------------------------
  */

  const handleReload = () => {

    if (pdfUrl) {

      URL.revokeObjectURL(
        pdfUrl,
      );

      setPdfUrl(null);

    }

    setPdfError(null);

    setPageNumber(1);

    setNumPages(0);

    setScale(1);

    void loadPdf();

  };


  /*
  |--------------------------------------------------------------------------
  | PDF Loaded
  |--------------------------------------------------------------------------
  */

  const handleDocumentLoadSuccess = ({
    numPages,
  }: {
    numPages: number;
  }) => {

    setNumPages(numPages);

    setPageNumber(1);

  };


  /*
  |--------------------------------------------------------------------------
  | PDF Load Error
  |--------------------------------------------------------------------------
  */

  const handleDocumentLoadError = (
    error: Error,
  ) => {

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

    setPageNumber(
      (current) =>
        Math.max(
          1,
          current - 1,
        ),
    );

  };


  /*
  |--------------------------------------------------------------------------
  | Next Page
  |--------------------------------------------------------------------------
  */

  const handleNextPage = () => {

    setPageNumber(
      (current) =>
        Math.min(
          numPages || 1,
          current + 1,
        ),
    );

  };


  /*
  |--------------------------------------------------------------------------
  | Zoom Out
  |--------------------------------------------------------------------------
  */

  const handleZoomOut = () => {

    setScale(
      (current) =>
        Math.max(
          0.6,
          Number(
            (current - 0.1).toFixed(1),
          ),
        ),
    );

  };


  /*
  |--------------------------------------------------------------------------
  | Zoom In
  |--------------------------------------------------------------------------
  */

  const handleZoomIn = () => {

    setScale(
      (current) =>
        Math.min(
          2,
          Number(
            (current + 0.1).toFixed(1),
          ),
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

      const blob =
        await downloadReceiptPdf.mutateAsync(
          payment.id,
        );


      if (
        !blob ||
        blob.size === 0
      ) {
        throw new Error(
          "The generated PDF is empty.",
        );
      }


      const pdfBlob =
        blob.type === "application/pdf"
          ? blob
          : new Blob(
              [blob],
              {
                type: "application/pdf",
              },
            );


      const url =
        URL.createObjectURL(
          pdfBlob,
        );


      const anchor =
        document.createElement(
          "a",
        );


      anchor.href = url;

      anchor.download =
        `payment-receipt-${receipt.receipt_number}.pdf`;


      document.body.appendChild(
        anchor,
      );

      anchor.click();

      anchor.remove();


      window.setTimeout(() => {

        URL.revokeObjectURL(
          url,
        );

      }, 1_000);

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
  |
  | Opens the generated PDF in a temporary browser tab.
  | This uses the browser's print capability, but the main
  | receipt page itself does NOT use the browser PDF viewer.
  |
  */

  const handlePrint = () => {

    if (!pdfUrl) {
      return;
    }


    const printWindow =
      window.open(
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
      <LoadingState
        message="Loading payment receipt..."
      />
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Payment Error
  |--------------------------------------------------------------------------
  */

  if (
    paymentQuery.isError ||
    !payment
  ) {

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

  if (
    !payment.receipt &&
    receiptQuery.isLoading
  ) {

    return (
      <LoadingState
        message="Loading official receipt..."
      />
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Receipt Error
  |--------------------------------------------------------------------------
  */

  if (
    receiptQuery.isError ||
    !receipt
  ) {

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
  | UI State
  |--------------------------------------------------------------------------
  */

  const isDownloading =
    downloadReceiptPdf.isPending;

  const isOpeningPdf =
    streamReceiptPdf.isPending ||
    pdfLoading;


  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (

    <div className="flex min-h-screen flex-col bg-muted/30">

      {/* ================================================================ */}
      {/* TOOLBAR                                                         */}
      {/* ================================================================ */}

      <header className="no-print sticky top-0 z-30 border-b bg-background/95 backdrop-blur">

        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

          {/* ------------------------------------------------------------ */}
          {/* Left                                                        */}
          {/* ------------------------------------------------------------ */}

          <div className="flex min-w-0 items-center gap-3">

            <Button
              variant="ghost"
              size="sm"
              onClick={goToPayment}
              disabled={
                isDownloading ||
                isOpeningPdf
              }
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


          {/* ------------------------------------------------------------ */}
          {/* Actions                                                      */}
          {/* ------------------------------------------------------------ */}

          <div className="flex shrink-0 items-center gap-2">

            {/* Reload */}

            <Button
              variant="outline"
              size="sm"
              onClick={handleReload}
              disabled={
                isOpeningPdf ||
                isDownloading
              }
            >

              {isOpeningPdf ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}

              <span className="hidden sm:inline">
                {isOpeningPdf
                  ? "Generating..."
                  : "Refresh"}
              </span>

              <span className="sm:hidden">
                {isOpeningPdf
                  ? "..."
                  : "Refresh"}
              </span>

            </Button>


            {/* ---------------------------------------------------------- */}
            {/* Page Controls                                               */}
            {/* ---------------------------------------------------------- */}

            {pdfUrl && (

              <div className="hidden items-center gap-1 md:flex">

                {/* Previous */}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={
                    handlePreviousPage
                  }
                  disabled={
                    pageNumber <= 1
                  }
                  title="Previous page"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>


                {/* Page Number */}

                <div className="min-w-[70px] text-center text-xs text-muted-foreground">

                  {pageNumber}

                  {numPages > 0 && (
                    <>
                      {" "}
                      / {numPages}
                    </>
                  )}

                </div>


                {/* Next */}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={
                    handleNextPage
                  }
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


            {/* ---------------------------------------------------------- */}
            {/* Zoom                                                        */}
            {/* ---------------------------------------------------------- */}

            {pdfUrl && (

              <div className="hidden items-center gap-1 lg:flex">

                <Button
                  variant="outline"
                  size="icon"
                  onClick={
                    handleZoomOut
                  }
                  disabled={
                    scale <= 0.6
                  }
                  title="Zoom out"
                >
                  <Minus className="h-4 w-4" />
                </Button>


                <span className="min-w-[48px] text-center text-xs text-muted-foreground">
                  {Math.round(
                    scale * 100,
                  )}
                  %
                </span>


                <Button
                  variant="outline"
                  size="icon"
                  onClick={
                    handleZoomIn
                  }
                  disabled={
                    scale >= 2
                  }
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
                {isDownloading
                  ? "..."
                  : "Download"}
              </span>

            </Button>

          </div>

        </div>

      </header>


      {/* ================================================================ */}
      {/* PDF AREA                                                        */}
      {/* ================================================================ */}

      <main className="flex flex-1 justify-center overflow-auto px-4 py-5 sm:px-6 sm:py-6">

        <div className="flex w-full max-w-6xl justify-center">

          <div className="relative min-h-[calc(100vh-105px)] w-full overflow-auto rounded-lg border bg-muted shadow-sm">

            {/* ========================================================== */}
            {/* Loading                                                     */}
            {/* ========================================================== */}

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


            {/* ========================================================== */}
            {/* Error                                                       */}
            {/* ========================================================== */}

            {pdfError && !pdfUrl && (

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


            {/* ========================================================== */}
            {/* PDF.JS DOCUMENT                                             */}
            {/* ========================================================== */}

            {pdfUrl && (

              <div className="flex min-h-[75vh] justify-center overflow-auto p-4 sm:p-6">

                <Document
                  file={pdfUrl}
                  onLoadSuccess={
                    handleDocumentLoadSuccess
                  }
                  onLoadError={
                    handleDocumentLoadError
                  }
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