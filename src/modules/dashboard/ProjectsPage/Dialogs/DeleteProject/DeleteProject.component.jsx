import ConfirmationDialog from '@/modules/core/Dialog/ConfirmationDialog.component';
import { useState } from 'react';

export default function DeleteProject({ open, onClose, project, onDeleteSuccess, triggerEl }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleProjectDelete = async () => {
    setIsSubmitting(true);
    try {
      const result = await window.api.project.delete({ id: project.id });
      if (result.success) {
        onDeleteSuccess();
        onClose();
      }
    } catch (e) {
      console.error('Error deleting project:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title='You are about to delete the project'
      label='Are you sure you want to delete this project?'
      actionsConfig={{ isSubmitting }}
      onSubmit={handleProjectDelete}
      triggerEl={triggerEl}
    />
  );
}
