'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DeleteModalProps = {
  isOpen: boolean;
  onClose: (open:boolean) => void;
  title?: string;
  description?: string;
  loading?: boolean;
  action:()=>void;
};

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  title = 'Delete Confirmation',
  description = 'Please type "delete" to confirm.',
  loading = false,
  action
}) => {
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!isOpen) setConfirmText('');
  }, [isOpen]);

  const isConfirmed = confirmText.toLowerCase().trim() === 'delete';
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 mb-2">{description}</p>
        <Input
          placeholder='Type "delete" to confirm'
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          disabled={loading}
        />
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={()=>onClose(false)} 
          disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={action}
            disabled={!isConfirmed || loading}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteModal;
