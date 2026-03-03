import ConfirmationDialog from '@/modules/core/Dialog/ConfirmationDialog.component';
import { useState } from 'react';

export default function DeleteProfile({ open, onClose, profileId, onDeleteSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProfileDelete = async () => {
    setIsSubmitting(true);
    try {
      await window.api.profile.delete({ id: profileId });
      onDeleteSuccess();
      onClose();
    } catch (e) {
      console.error('Error deleting profile:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title='You are about to delete the profile'
      label='Are you sure you want to delete this profile?'
      actionsConfig={{ isSubmitting }}
      onSubmit={handleProfileDelete}
    />
  );
}
