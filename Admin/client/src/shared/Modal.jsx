import React from 'react';
import '../styles/Modal.css';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export default Modal;