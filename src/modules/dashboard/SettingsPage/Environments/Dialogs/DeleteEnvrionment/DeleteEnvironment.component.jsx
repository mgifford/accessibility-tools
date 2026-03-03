import ConfirmationDialog from '@/modules/core/Dialog/ConfirmationDialog.component';
import { useSystemStore } from '@/stores';
import { useState } from 'react';

export default function DeleteEnvironment({ open, onClose, environmentId, onDeleteSuccess }) {
  const { removeEnvironment } = useSystemStore();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTestCaseDelete = async () => {
    setIsSubmitting(true);
    try {
      await window.api.systemEnvironment.delete({ id: environmentId });
      removeEnvironment(environmentId);
      onDeleteSuccess();
      onClose();
    } catch (e) {
      console.error('Error deleting environment:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title='You are about to delete the environment'
      label='Are you sure you want to delete this environment?'
      actionsConfig={{ isSubmitting }}
      onSubmit={handleTestCaseDelete}
    />
  );
}
