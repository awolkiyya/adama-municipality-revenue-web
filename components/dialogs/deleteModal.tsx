"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DeleteModalProps = {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  title?: string;
  description?: string;
  loading?: boolean;
  action: () => void;
};

export default function DeleteModal(props: DeleteModalProps) {
  const { isOpen } = props;

  return (
    <DeleteModalContent
      key={isOpen ? "open" : "closed"}
      {...props}
    />
  );
}

function DeleteModalContent({
  isOpen,
  onClose,
  title = "Delete Confirmation",
  description = 'Please type "delete" to confirm.',
  loading = false,
  action,
}: DeleteModalProps) {
  const [confirmText, setConfirmText] = useState("");

  const isConfirmed =
    confirmText.toLowerCase().trim() === "delete";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <p className="mb-2 text-sm text-gray-600">
          {description}
        </p>

        <Input
          placeholder='Type "delete" to confirm'
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          disabled={loading}
          autoComplete="off"
        />

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={action}
            disabled={!isConfirmed || loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}