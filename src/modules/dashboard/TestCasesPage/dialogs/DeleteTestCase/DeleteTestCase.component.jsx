import ConfirmationDialog from '@/modules/core/Dialog/ConfirmationDialog.component';
import { useState } from 'react';

export default function DeleteTestCase({ open, onClose, testCaseId, onDeleteSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTestCaseDelete = async () => {
    setIsSubmitting(true);
    try {
      await window.api.testCase.delete({ id: testCaseId });
      onDeleteSuccess();
      onClose();
    } catch (e) {
      console.error('Error deleting test case:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title='You are about to delete the test case'
      label='Are you sure you want to delete this test case?'
      actionsConfig={{ isSubmitting }}
      onSubmit={handleTestCaseDelete}
    />
  );
}
