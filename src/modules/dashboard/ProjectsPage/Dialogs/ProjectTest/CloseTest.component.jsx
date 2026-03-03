import ConfirmationDialog from '@/modules/core/Dialog/ConfirmationDialog.component';
import { useState } from 'react';

export default function CloseTest({ open, onClose, testId, onCloseSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCloseTest = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await window.api.environmentTest.close({ id: testId });
      onCloseSuccess();
      onClose();
    } catch (e) {
      console.error('Error closing test:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title='You are about to close the test'
      label='Are you sure you want to close this test?'
      actionsConfig={{
        nextLabel: 'Close',
        isSubmitting: isSubmitting
      }}
      onSubmit={handleCloseTest}
    />
  );
}
