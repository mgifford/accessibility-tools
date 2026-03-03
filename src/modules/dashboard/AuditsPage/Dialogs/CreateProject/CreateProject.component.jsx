import ConfirmationDialog from '@/modules/core/Dialog/ConfirmationDialog.component';
import { useRouter } from 'next/router';

const CreateProject = ({ open, onClose }) => {
  const router = useRouter();

  const handleSubmit = () => {
    router.push('/projects?openCreate=true');
  };

  return (
    <ConfirmationDialog
      open={open}
      onClose={onClose}
      title='Create new project?'
      label='You need a project before creating audits'
      actionsConfig={{ nextLabel: 'Create new project' }}
      onSubmit={handleSubmit}
      requireAcknowledgement={false}
      variant='primary'
    />
  );
};
export default CreateProject;
