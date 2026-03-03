import { info } from '@/assets/icons';
import Icon from '@/modules/core/Icon';
import { useProjectTestFormStore } from '@/stores/useProjectTestFormStore';
import { Typography } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import classNames from 'classnames';
import styles from './ProjectTest.module.scss';
import SitemapForm from './SitemapForm';

const StepThree = () => {
  const { structuredPages, addStructuredPage, removeStructuredPage, handleChange } = useProjectTestFormStore();

  const onSiteMapUpdate = async (newPageValue, index) => {
    const updatedStructuredPages = [...structuredPages];
    updatedStructuredPages[index] = newPageValue || { id: '', label: '' };
    handleChange('structuredPages', updatedStructuredPages);
  };

  return (
    <div className={styles.stepThree}>
      <Typography variant='body1' className={styles.stepHeader}>
        Structured sample web pages
        <Tooltip
          title={(
            <>
              <Typography className={styles.toolTip} sx={{ mb: 1 }}>
                Select web pages that reflect all identified:
              </Typography>

              <ol style={{ margin: 0, paddingLeft: '18px' }}>
                <li>common web pages</li>
                <li>essential functionality</li>
                <li>types of web pages</li>
                <li>web technologies relied upon</li>
                <li>other relevant web pages</li>
              </ol>

              <Typography className={styles.toolTip} sx={{ mt: 1 }}>
                For more information, see{' '}
                <a href='https://www.w3.org/TR/WCAG-EM/#step3a' target='_blank'>
                  WCAG-EM Step 3.a: Include a Structured Sample
                </a>
                .
              </Typography>

              <Typography className={styles.toolTip} variant='caption' display='block' sx={{ mt: 1 }}>
                Note: ‘Web pages’ include different ‘web page states’; see definition of web page states.
              </Typography>
            </>
          )}
        >
          <span className={styles.infoIcon}>
            <Icon className={classNames('clym-contrast-exclude', styles.icon)} icon={info} />
          </span>
        </Tooltip>
      </Typography>
      <SitemapForm pagesType='structured' onSiteMapUpdate={onSiteMapUpdate} addPage={addStructuredPage} removePage={removeStructuredPage} />
    </div>
  );
};

export default StepThree;
