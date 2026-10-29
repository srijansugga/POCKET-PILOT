import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isDestructive
                ? 'bg-[#FF5C5C]/15 text-[#FF5C5C]'
                : 'bg-[#F4B860]/15 text-[#F4B860]'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="text-sm text-[#A5ABC0] leading-relaxed mt-0.5">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#221C24]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#A5ABC0] hover:text-[#F5F6FC] bg-[#221C24] hover:bg-[#322936] rounded-xl transition-colors focus:ring-2 focus:ring-[#EF4444]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl text-white transition-colors focus:ring-2 ${
              isDestructive
                ? 'bg-[#FF5C5C] hover:bg-[#FF4545] focus:ring-[#FF5C5C]'
                : 'bg-[#EF4444] hover:bg-[#DC2626] focus:ring-[#EF4444]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
};
