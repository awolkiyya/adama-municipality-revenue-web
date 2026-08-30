"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";

import {
  Eye,
  Trash2,
  Pencil,
  MoreHorizontal,
  Plus,
  Shield,
  Lock,
  UserCog,
  Send,
  Edit,
  KeyRound,
  Variable,

  // Invoice actions
  FileCheck,
  Percent,
  BadgeDollarSign,
  Ban,
  CreditCard,
  Printer,
  Download,
} from "lucide-react";


/* =====================================================
   TYPES
===================================================== */

type Props = {

  actions: {

    /* -------------------------------------------------
       CORE ACTIONS
    ------------------------------------------------- */

    view?: boolean;

    edit?: boolean;

    delete?: boolean;

    create?: boolean;


    /* -------------------------------------------------
       STATUS
    ------------------------------------------------- */

    toggleStatus?: boolean;


    /* -------------------------------------------------
       ACCESS / SECURITY
    ------------------------------------------------- */

    manageAccess?: boolean;

    updatePassword?: boolean;

    updateRole?: boolean;

    updateHierarchy?: boolean;


    /* -------------------------------------------------
       TARIFF
    ------------------------------------------------- */

    manageFormulaVariables?: boolean;


    /* -------------------------------------------------
       WORKFLOW
    ------------------------------------------------- */

    submit?: boolean;

    return?: boolean;

    approve?: boolean;


    /* -------------------------------------------------
       INVOICE ACTIONS
    ------------------------------------------------- */

    issue?: boolean;

    applyDiscount?: boolean;

    applyPenalty?: boolean;

    cancel?: boolean;

    void?: boolean;

    pay?: boolean;

    print?: boolean;

    download?: boolean;


    /* -------------------------------------------------
       OTHER DOMAIN ACTIONS
    ------------------------------------------------- */

    createActivity?: boolean;

    export?: boolean;

    impersonate?: boolean;

    createResolution?: boolean;

    escalatePenality?: boolean;

    requestClosure?: boolean;
  };


  /* ---------------------------------------------------
     CORE CALLBACKS
  --------------------------------------------------- */

  onView?: () => void;

  onEdit?: () => void;

  onDelete?: () => void;

  onCreate?: () => void;


  /* ---------------------------------------------------
     STATUS CALLBACK
  --------------------------------------------------- */

  onToggleStatus?: () => void;


  /* ---------------------------------------------------
     ACCESS / SECURITY CALLBACKS
  --------------------------------------------------- */

  onManageAccess?: () => void;

  onUpdatePassword?: () => void;

  onUpdateRole?: () => void;

  onUpdateHierarchy?: () => void;


  /* ---------------------------------------------------
     TARIFF CALLBACK
  --------------------------------------------------- */

  onManageFormulaVariables?: () => void;


  /* ---------------------------------------------------
     WORKFLOW CALLBACKS
  --------------------------------------------------- */

  onSubmit?: () => void;

  onReturn?: () => void;

  onApprove?: () => void;


  /* ---------------------------------------------------
     INVOICE CALLBACKS
  --------------------------------------------------- */

  onIssue?: () => void;

  onApplyDiscount?: () => void;

  onApplyPenalty?: () => void;

  onCancel?: () => void;

  onVoid?: () => void;

  onPay?: () => void;

  onPrint?: () => void;

  onDownload?: () => void;


  /* ---------------------------------------------------
     OTHER DOMAIN CALLBACKS
  --------------------------------------------------- */

  onCreateResolution?: () => void;

  onEscalatePenality?: () => void;

  onRequestClosure?: () => void;


  /* ---------------------------------------------------
     ROW
  --------------------------------------------------- */

  row?: any;
};


/* =====================================================
   COMPONENT
===================================================== */

export function RowActions({

  actions,

  row,

  /* Core */
  onView,
  onEdit,
  onDelete,
  onCreate,

  /* Status */
  onToggleStatus,

  /* Access */
  onManageAccess,
  onUpdatePassword,
  onUpdateRole,
  onUpdateHierarchy,

  /* Tariff */
  onManageFormulaVariables,

  /* Workflow */
  onSubmit,
  onReturn,
  onApprove,

  /* Invoice */
  onIssue,
  onApplyDiscount,
  onApplyPenalty,
  onCancel,
  onVoid,
  onPay,
  onPrint,
  onDownload,

  /* Other */
  onCreateResolution,
  onEscalatePenality,
  onRequestClosure,

}: Props) {


  /* ===================================================
     GOVERNANCE ACTIONS
  =================================================== */

  const hasGovernanceActions =
    actions.manageAccess ||
    actions.updatePassword ||
    actions.updateRole ||
    actions.updateHierarchy ||
    actions.escalatePenality ||
    actions.createResolution;


  /* ===================================================
     FORMULA VARIABLE ACTION
  =================================================== */

  const canManageFormulaVariables =
    actions.manageFormulaVariables &&
    String(
      row?.calculationType ?? ""
    ).toLowerCase() === "formula";


  /* ===================================================
     INVOICE ACTIONS
  =================================================== */

  const hasInvoiceActions =
    actions.issue ||
    actions.applyDiscount ||
    actions.applyPenalty ||
    actions.pay ||
    actions.print ||
    actions.download ||
    actions.cancel ||
    actions.void;


  /* ===================================================
     WORKFLOW ACTIONS
  =================================================== */

  const hasWorkflowActions =
    actions.submit ||
    actions.return ||
    actions.approve;


  /* ===================================================
     RENDER
  =================================================== */

  return (

    <DropdownMenu>

      {/* =================================================
          TRIGGER
      ================================================= */}

      <DropdownMenuTrigger asChild>

        <Button
          variant="ghost"
          size="icon"
        >

          <MoreHorizontal className="h-4 w-4" />

        </Button>

      </DropdownMenuTrigger>


      {/* =================================================
          MENU
      ================================================= */}

      <DropdownMenuContent
        align="end"
        className="w-56"
      >


        {/* =================================================
            CORE ACTIONS
        ================================================= */}


        {actions.view && (

          <DropdownMenuItem
            onClick={onView}
          >

            <Eye className="mr-2 h-4 w-4" />

            View

          </DropdownMenuItem>

        )}


        {actions.edit && (

          <DropdownMenuItem
            onClick={onEdit}
          >

            <Pencil className="mr-2 h-4 w-4" />

            Edit

          </DropdownMenuItem>

        )}


        {actions.create && (

          <DropdownMenuItem
            onClick={onCreate}
          >

            <Plus className="mr-2 h-4 w-4" />

            Create

          </DropdownMenuItem>

        )}


        {actions.toggleStatus && (

          <DropdownMenuItem
            onClick={onToggleStatus}
          >

            <Edit className="mr-2 h-4 w-4" />

            Update Status

          </DropdownMenuItem>

        )}


        {/* =================================================
            WORKFLOW ACTIONS
        ================================================= */}

        {hasWorkflowActions && (

          <DropdownMenuSeparator />

        )}


        {actions.submit && (

          <DropdownMenuItem
            onClick={onSubmit}
          >

            <Send className="mr-2 h-4 w-4" />

            Submit

          </DropdownMenuItem>

        )}


        {actions.return && (

          <DropdownMenuItem
            onClick={onReturn}
          >

            <Send className="mr-2 h-4 w-4 rotate-180" />

            Return

          </DropdownMenuItem>

        )}


        {actions.approve && (

          <DropdownMenuItem
            onClick={onApprove}
          >

            <FileCheck className="mr-2 h-4 w-4" />

            Approve

          </DropdownMenuItem>

        )}


        {/* =================================================
            INVOICE ACTIONS
        ================================================= */}

        {hasInvoiceActions && (

          <DropdownMenuSeparator />

        )}


        {/* ISSUE */}

        {actions.issue && (

          <DropdownMenuItem
            onClick={onIssue}
          >

            <FileCheck className="mr-2 h-4 w-4" />

            Issue Invoice

          </DropdownMenuItem>

        )}


        {/* DISCOUNT */}

        {actions.applyDiscount && (

          <DropdownMenuItem
            onClick={onApplyDiscount}
          >

            <Percent className="mr-2 h-4 w-4" />

            Apply Discount

          </DropdownMenuItem>

        )}


        {/* PENALTY */}

        {actions.applyPenalty && (

          <DropdownMenuItem
            onClick={onApplyPenalty}
          >

            <BadgeDollarSign className="mr-2 h-4 w-4" />

            Apply Penalty

          </DropdownMenuItem>

        )}


        {/* PAYMENT */}

        {actions.pay && (

          <DropdownMenuItem
            onClick={onPay}
          >

            <CreditCard className="mr-2 h-4 w-4" />

            Record Payment

          </DropdownMenuItem>

        )}


        {/* PRINT */}

        {actions.print && (

          <DropdownMenuItem
            onClick={onPrint}
          >

            <Printer className="mr-2 h-4 w-4" />

            Print Invoice

          </DropdownMenuItem>

        )}


        {/* DOWNLOAD */}

        {actions.download && (

          <DropdownMenuItem
            onClick={onDownload}
          >

            <Download className="mr-2 h-4 w-4" />

            Download Invoice

          </DropdownMenuItem>

        )}


        {/* CANCEL */}

        {actions.cancel && (

          <DropdownMenuItem
            onClick={onCancel}
            className="
              text-orange-600
              focus:text-orange-600
            "
          >

            <Ban className="mr-2 h-4 w-4" />

            Cancel Invoice

          </DropdownMenuItem>

        )}


        {/* VOID */}

        {actions.void && (

          <DropdownMenuItem
            onClick={onVoid}
            className="
              text-red-600
              focus:text-red-600
            "
          >

            <Ban className="mr-2 h-4 w-4" />

            Void Invoice

          </DropdownMenuItem>

        )}


        {/* =================================================
            DOMAIN ACTIONS
        ================================================= */}


        {actions.requestClosure && (

          <>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={onRequestClosure}
            >

              <Send className="mr-2 h-4 w-4" />

              Request Closure

            </DropdownMenuItem>

          </>

        )}


        {/* =================================================
            FORMULA VARIABLES
        ================================================= */}


        {canManageFormulaVariables && (

          <>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={
                onManageFormulaVariables
              }
            >

              <Variable className="mr-2 h-4 w-4" />

              Manage Formula Variables

            </DropdownMenuItem>

          </>

        )}


        {/* =================================================
            SECURITY / GOVERNANCE
        ================================================= */}


        {hasGovernanceActions && (

          <DropdownMenuSeparator />

        )}


        {actions.manageAccess && (

          <DropdownMenuItem
            onClick={onManageAccess}
          >

            <KeyRound className="mr-2 h-4 w-4" />

            Manage Access

          </DropdownMenuItem>

        )}


        {actions.updatePassword && (

          <DropdownMenuItem
            onClick={onUpdatePassword}
          >

            <Lock className="mr-2 h-4 w-4" />

            Update Password

          </DropdownMenuItem>

        )}


        {actions.updateRole && (

          <DropdownMenuItem
            onClick={onUpdateRole}
          >

            <UserCog className="mr-2 h-4 w-4" />

            Update Role

          </DropdownMenuItem>

        )}


        {actions.updateHierarchy && (

          <DropdownMenuItem
            onClick={onUpdateHierarchy}
          >

            <Shield className="mr-2 h-4 w-4" />

            Update Structure

          </DropdownMenuItem>

        )}


        {actions.escalatePenality && (

          <DropdownMenuItem
            onClick={onEscalatePenality}
          >

            <Shield className="mr-2 h-4 w-4" />

            Escalate Penalty

          </DropdownMenuItem>

        )}


        {actions.createResolution && (

          <DropdownMenuItem
            onClick={onCreateResolution}
          >

            <Shield className="mr-2 h-4 w-4" />

            Create Resolution

          </DropdownMenuItem>

        )}


        {/* =================================================
            DANGEROUS ACTION
        ================================================= */}


        {actions.delete && (

          <>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={onDelete}
              className="
                text-red-600
                focus:text-red-600
              "
            >

              <Trash2 className="mr-2 h-4 w-4" />

              Delete

            </DropdownMenuItem>

          </>

        )}


      </DropdownMenuContent>

    </DropdownMenu>
  );
}