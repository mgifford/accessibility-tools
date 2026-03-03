import ConfirmationDialog from '@/modules/core/Dialog/ConfirmationDialog.component';
import { useState } from 'react';

export default function DeleteRemediationCategory({ open, onClose, remediationCategoryId, onDeleteSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRemediationCategoryDelete = async () => {
    setIsSubmitting(true);
    try {
      await window.api.systemCategory.delete({ id: remediationCategoryId });
      onDeleteSuccess();
      onClose();
    } catch (e) {
      console.error('Error deleting remediation category:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title='You are about to delete the remediation category'
      label='Are you sure you want to delete this remediation category?'
      actionsConfig={{ isSubmitting }}
      onSubmit={handleRemediationCategoryDelete}
    />
  );
}
