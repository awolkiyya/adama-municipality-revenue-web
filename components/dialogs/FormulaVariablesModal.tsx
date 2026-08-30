"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import FormulaVariablesForm from "../forms/FormulaVariablesForm";

interface Props {
  open: boolean;
  onClose: () => void;
  tariffRuleId: string;
  /** The formula expression saved on this tariff rule, e.g. "land_area * rate + base_fee". */
  formula?: string | null;
}

export default function FormulaVariablesModal({
  open,
  onClose,
  tariffRuleId,
  formula,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="flex w-[95vw] min-w-4xl flex-col gap-0 overflow-hidden p-0">
        <FormulaVariablesForm
          variant="modal"
          tariffRuleId={tariffRuleId}
          formula={formula}
          enabled={open}
          onSaved={onClose}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}