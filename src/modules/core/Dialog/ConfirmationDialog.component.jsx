import { alertCircle, xIcon } from '@/assets/icons';
import Icon from '@/modules/core/Icon';
import { Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, IconButton, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import classNames from 'classnames';
import { useEffect, useRef, useState } from 'react';
import styles from './ConfirmationDialog.module.scss';

const renderDefaultActions = (actionsConfig, handleClose, nextRef = null) => {
  if (!actionsConfig) return null;

  const { requireAcknowledgement, isSubmitting = false, nextLabel = 'Delete', backLabel = 'Cancel', isOpen } = actionsConfig;

  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleCheckboxChange = (event) => {
    setIsConfirmed(event.target.checked);
  };

  useEffect(() => {
    setIsConfirmed(false);
  }, [isOpen]);

  const disabled = requireAcknowledgement && !isConfirmed;

  return (
    <>
      <div>
        {requireAcknowledgement && (
          <FormControlLabel
            control={(
              <Checkbox
                checked={isConfirmed}
                onChange={handleCheckboxChange}
                className={styles.checkbox}
                icon={<CustomCheckboxIcon isChecked={false} />}
                checkedIcon={<CustomCheckboxIcon isChecked={true} />}
              />
            )}
            label={<Typography>Yes, I’m sure</Typography>}
            className={styles.checkboxLabel}
          />
        )}
      </div>
      <div className={styles.actionButtons}>
        <Button onClick={handleClose} variant='outlined' className={styles.cancelBtn}>
          <Typography variant='body1'>{backLabel}</Typography>
        </Button>
        <Button type='submit' variant='contained' color='error' disabled={disabled || isSubmitting} className={styles.actionBtn} ref={nextRef}>
          {isSubmitting && <CircularProgress className={styles.progressSpinner} color='inherit' size={16} />}
          <Typography variant='body1'>{nextLabel}</Typography>
        </Button>
      </div>
    </>
  );
};

const CustomCheckboxIcon = ({ isChecked }) => (
  <div className={`${styles.checkboxBase}`}>
    {isChecked && (
      <span className={styles.checkboxX}>
        <Typography variant='body2'>X</Typography>
      </span>
    )}
  </div>
);

export default function ConfirmationDialog({
  open = false,
  title = '',
  label = '',
  titleIcon = null,
  actions = null,
  actionsConfig = null,
  nextRef = null,
  maxWidth = 'sm',
  fullWidth = true,
  className = '',
  variant = 'default',
  dialogHeaderClassName = '',
  dialogContentClassName = '',
  dialogActionsClassName = '',
  dialogContainerClassName = '',
  dialogContentContainer = '',
  dialogFormClassName = '',
  requireAcknowledgement = true,
  PaperProps = {},
  onClose = () => {},
  onSubmit = () => {},
  triggerEl = null
}) {
  const triggerRef = useRef(triggerEl);

  useEffect(() => {
    if (!triggerEl) return;
    triggerRef.current = triggerEl;
  }, [triggerEl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleBlur();
    onSubmit(e);
  };

  const handleClose = (e) => {
    handleBlur();
    onClose(e);
  };

  const handleBlur = () => {
    if (typeof document !== 'undefined') {
      const active = document.activeElement;
      if (active && active instanceof HTMLElement) {
        active.blur();
      }
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      keepMounted={false}
      className={classNames(styles.root, className, { [styles[variant]]: variant })}
      classes={{ container: dialogContainerClassName }}
      PaperProps={{
        ...PaperProps,
        className: classNames(PaperProps.className, styles.dialog)
      }}
      onClose={onClose}
      TransitionProps={{
        onExited: () => {
          if (triggerRef.current) {
            triggerRef.current.focus();
          }
        }
      }}
    >
      <div className={classNames(styles.dialogContentContainer, dialogContentContainer)}>
        <form onSubmit={handleSubmit} className={classNames(styles.delete, dialogFormClassName)}>
          <DialogTitle className={classNames(styles.dialogHeader, dialogHeaderClassName)} component='div'>
            {titleIcon || (
              <div className={styles.iconContainer}>
                <Icon icon={alertCircle} className={styles.icon} showShadow={true} variant={variant === 'primary' ? 'default' : 'error'} />
              </div>
            )}
            <div className={styles.dialogHeaderContent}>
              <Typography variant='h2' align='center'>
                {title}
              </Typography>
            </div>
          </DialogTitle>
          <DialogContent className={classNames(styles.dialogContent, dialogContentClassName)}>
            <Typography>{label}</Typography>
          </DialogContent>
          <DialogActions className={classNames(styles.dialogActions, styles.delete, dialogActionsClassName)}>
            {actions || renderDefaultActions({ ...actionsConfig, requireAcknowledgement, isOpen: open }, handleClose, nextRef)}
          </DialogActions>
        </form>
      </div>
      <IconButton className={styles.closeDialogButton} aria-label='Close dialog' onClick={handleClose} edge='end'>
        <Icon className={classNames('clym-contrast-exclude', styles.icon)} icon={xIcon} />
      </IconButton>
    </Dialog>
  );
}
