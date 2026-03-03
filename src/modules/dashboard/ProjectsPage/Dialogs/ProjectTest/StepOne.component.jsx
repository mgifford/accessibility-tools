import Select from '@/modules/core/Select';
import { useProjectTestFormStore } from '@/stores/useProjectTestFormStore';
import { TextField, Typography } from '@mui/material';
import { useEffect } from 'react';
import styles from './ProjectTest.module.scss';

const StepOne = ({ environments, isEdit = false }) => {
  const { testName, environmentType, errors, touched, handleChange, handleBlur, setEnvironmentType } = useProjectTestFormStore();

  const environmentOptions = environments.map(env => ({
    value: env.id,
    label: env.name
  }));

  useEffect(() => {
    if (environments.length > 0 && !environmentType) {
      setEnvironmentType(environments[0].id);
    }
  }, [environments, environmentType, setEnvironmentType]);

  return (
    <div className={styles.stepOne}>
      <div className={styles.formField}>
        <TextField
          label={<Typography>Test name</Typography>}
          required
          value={testName}
          onChange={e => handleChange('testName', e.target.value)}
          onBlur={e => handleBlur('testName', e.target.value)}
          fullWidth
          margin='normal'
          className={styles.textField}
          error={touched.testName && Boolean(errors.testName)}
          helperText={touched.testName && errors.testName}
        />
      </div>
      <Select
        label='Environment type'
        value={environmentOptions.some(opt => opt.value === environmentType) ? environmentType : ''}
        onChange={value => handleChange('environmentType', value)}
        options={environmentOptions}
        disabled={environmentOptions.length < 1 || isEdit}
      />
    </div>
  );
};

export default StepOne;
