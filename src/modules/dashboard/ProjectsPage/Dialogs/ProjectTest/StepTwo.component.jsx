import { info } from '@/assets/icons';
import Icon from '@/modules/core/Icon';
import { useProjectTestFormStore } from '@/stores/useProjectTestFormStore';
import { TextField, Tooltip, Typography } from '@mui/material';
import classNames from 'classnames';
import styles from './ProjectTest.module.scss';

const StepTwo = () => {
  const { essentialFunctionality, webPageTypes, handleChange, handleBlur } = useProjectTestFormStore();
  return (
    <>
      <Typography variant='body1' sx={{ mt: 2, fontWeight: 700 }}>
        Notes
      </Typography>
      <div className={styles.formField}>
        <TextField
          label={(
            <div>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: '20px', top: '-20px' }}>
                Essential functionality of the website
                <Tooltip title="Provide a brief description of the website's core functionalities.">
                  <span className={styles.infoIcon}>
                    <Icon className={classNames('clym-contrast-exclude', styles.icon)} icon={info} />
                  </span>
                </Tooltip>
              </span>
            </div>
          )}
          value={essentialFunctionality}
          onChange={e => handleChange('essentialFunctionality', e.target.value)}
          onBlur={e => handleBlur('essentialFunctionality', e.target.value)}
          fullWidth
          margin='normal'
          multiline
          rows={4}
          className={styles.textField}
        />
      </div>
      <div className={styles.formField}>
        <TextField
          label={(
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', lineHeight: '20px', top: '-20px' }}>
              Variety of web page types
              <Tooltip title='Provide a brief description of the variety of page types.'>
                <span className={styles.infoIcon}>
                  <Icon className={classNames('clym-contrast-exclude', styles.icon)} icon={info} />
                </span>
              </Tooltip>
            </span>
          )}
          value={webPageTypes}
          onChange={e => handleChange('webPageTypes', e.target.value)}
          onBlur={e => handleBlur('webPageTypes', e.target.value)}
          fullWidth
          margin='normal'
          multiline
          rows={4}
          className={styles.textField}
        />
      </div>
    </>
  );
};
export default StepTwo;
