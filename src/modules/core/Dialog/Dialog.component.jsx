import { xIcon } from '@/assets/icons';
import Icon from '@/modules/core/Icon';
import { CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import Button from '@mui/material/Button';
import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import ProgressBar from '../ProgressBar';
import styles from './Dialog.module.scss';

const renderDefaultActions = (actionsConfig, handleClose, nextRef = null, stepsConfig) => {
  if (!actionsConfig) return null;

  const { disabled = false, isSubmitting = false, onBack } = actionsConfig;
  let { nextLabel, backLabel } = actionsConfig;
  const { curr, count } = stepsConfig;

  if (!nextLabel) {
    nextLabel = curr === count - 1 ? 'Create' : 'Next';
  }
  if (!backLabel) {
    backLabel = curr === 0 ? 'Cancel' : 'Back';
  }

  return (
    <>
      <Button type='submit' variant='contained' disabled={disabled || isSubmitting} className={styles.submitBtn} ref={nextRef}>
        {isSubmitting && <CircularProgress className={styles.progressSpinner} color='inherit' size={16} />}
        <Typography variant='body1'>{nextLabel}</Typography>
      </Button>
      <Button onClick={onBack} className={styles.backBtn}>
        <Typography variant='body1'>{backLabel}</Typography>
      </Button>
    </>
  );
};

export default function CoreDialog({
  open = false,
  steps = [],
  currentStep = 0,
  title = '',
  titleIcon = null,
  children = null,
  actions = null,
  actionsConfig = null,
  nextRef = null,
  maxWidth = 'sm',
  fullWidth = true,
  className = '',
  dialogHeaderClassName = '',
  dialogContentClassName = '',
  dialogActionsClassName = '',
  dialogContainerClassName = '',
  dialogContentContainer = '',
  dialogFormClassName = '',
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

  const step = steps?.[currentStep];

  return (
    <Dialog
      open={open}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      keepMounted={false}
      className={classNames(styles.coreDialog, className)}
      classes={{ container: dialogContainerClassName }}
      PaperProps={{
        ...PaperProps,
        className: classNames(PaperProps.className, styles.dialog)
      }}
      onClose={(event, reason) => {
        if (reason === 'backdropClick') return;
        onClose();
      }}
      TransitionProps={{
        onExited: () => {
          if (triggerRef.current) {
            triggerRef.current.focus();
          }
        }
      }}
    >
      <div className={classNames(styles.dialogContentContainer, dialogContentContainer)}>
        <form onSubmit={handleSubmit} className={dialogFormClassName}>
          <DialogTitle className={classNames(styles.dialogHeader, dialogHeaderClassName)} component='div'>
            {titleIcon && titleIcon}
            {typeof title === 'string'
              ? (
                <Typography variant='h2' align='center'>
                  {title}
                </Typography>
                )
              : (
                  title
                )}
            {steps.length > 1 && step?.helpText && (
              <Typography variant='body2' className={styles.helpText}>
                {currentStep + 1}. {step.helpText}
              </Typography>
            )}
          </DialogTitle>
          <DialogContent className={classNames(styles.dialogContent, dialogContentClassName)}>
            {steps && steps.length > 1 && <ProgressBar totalSteps={steps.length} currentStep={currentStep + 1} />}
            {step?.component}
            {children}
          </DialogContent>
          <DialogActions className={classNames(styles.dialogActions, dialogActionsClassName)}>
            {actions || renderDefaultActions(actionsConfig, handleClose, nextRef, { curr: currentStep, count: steps.length })}
          </DialogActions>
          <IconButton className={styles.closeDialogButton} aria-label='Close dialog' onClick={handleClose} edge='end'>
            <Icon className={classNames('clym-contrast-exclude', styles.icon)} icon={xIcon} />
          </IconButton>
        </form>
      </div>
    </Dialog>
  );
}
