import ConfirmationDialog from '@/modules/core/Dialog/ConfirmationDialog.component';
import { useState } from 'react';

export default function DeleteRemediation({ open, onClose, remediationId: remediationId, onDeleteSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleRemediationDelete = async () => {
    setIsSubmitting(true);
    try {
      await window.api.remediation.delete({ id: remediationId });
      onDeleteSuccess();
      onClose();
    } catch (e) {
      console.error('Error deleting remediation:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title='You are about to delete the remediation'
      label='Are you sure you want to delete this remediation?'
      actionsConfig={{ isSubmitting }}
      onSubmit={handleRemediationDelete}
    />
  );
}
