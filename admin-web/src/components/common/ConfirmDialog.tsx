import React from 'react';
import Button from './Button';
import Modal from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  /** What the reader loses by confirming. Be specific — name the record. */
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use for actions that destroy data. */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onCancel}
    title={title}
    size="sm"
    footer={
      <div className="flex justify-end gap-3">
        <Button variant="outline" type="button" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          type="button"
          onClick={onConfirm}
          loading={loading}
          disabled={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    }
  >
    <div className="text-sm text-gray-600 dark:text-gray-300">{message}</div>
  </Modal>
);

export default ConfirmDialog;
