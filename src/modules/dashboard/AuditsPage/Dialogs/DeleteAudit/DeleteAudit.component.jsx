import ConfirmationDialog from '@/modules/core/Dialog/ConfirmationDialog.component';
import { useState } from 'react';

export default function DeleteAudit({ open, onClose, audit, onDeleteSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleAuditDelete = async () => {
    setIsSubmitting(true);
    try {
      const result = await window.api.audit.delete({ id: audit.id });
      if (result.success) {
        console.log('success');
        onDeleteSuccess();
        onClose();
      }
    } catch (e) {
      console.error('Error deleting audit:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title='You are about to delete the audit'
      label='Are you sure you want to delete this audit?'
      actionsConfig={{ isSubmitting }}
      onSubmit={handleAuditDelete}
    />
  );
}
