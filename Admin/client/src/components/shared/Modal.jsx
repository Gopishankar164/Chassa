import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer = null,
  size = 'md',
  closeButton = true,
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl ${sizes[size]} w-full`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {closeButton && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <X size={24} />
            </button>
          )}
        </div>

        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="secondary" onClick={onClose}>{cancelText}</Button>
        <Button 
          variant={isDangerous ? 'danger' : 'primary'} 
          onClick={onConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};
