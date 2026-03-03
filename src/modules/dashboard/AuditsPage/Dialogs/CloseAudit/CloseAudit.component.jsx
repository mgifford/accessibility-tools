import ConfirmationDialog from '@/modules/core/Dialog/ConfirmationDialog.component';
import { useState } from 'react';

export default function CloseAudit({ open, onClose, audit, onCloseSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuditClose = async () => {
    try {
      setIsSubmitting(true);
      const result = await window.api.audit.update({ id: audit.id, status: 'CLOSED' });
      if (result) {
        onCloseSuccess();
        onClose();
      }
    } catch (e) {
      console.error('Error closing audit:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title='You are about to close the audit'
      label='Are you sure you want to close this audit?'
      actionsConfig={{ isSubmitting, nextLabel: 'Close' }}
      onSubmit={handleAuditClose}
    />
  );
}
