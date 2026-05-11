import { code, filePlus, reset } from '@/assets/icons';
import { compareUrls } from '@/electron/lib/utils';
import IconButton from '@/modules/core/IconButton';
import SplitButton from '@/modules/core/SplitButton';
import { useProjectStore, useSnackbarStore, useWebviewStore } from '@/stores';
import { Box, CircularProgress, Typography } from '@mui/material';
import classNames from 'classnames';
import { useState } from 'react';
import style from './Tabs.module.scss';

const Tab = ({ tab, selectedTab, setSelectedTab, isPageLoading, index, className }) => {
  return (
    <Box className={classNames(style.tab, { [style.active]: index === selectedTab }, className)} onClick={() => setSelectedTab(index)}>
      {index === selectedTab && isPageLoading && <CircularProgress size={16} />}
      <Typography>{tab.label}</Typography>
    </Box>
  );
};

const Tabs = () => {
  const { isPageLoading, selectedPage, setSelectedPage, selectedTest, scanPage, isTestRescanLoading, isPageRescanLoading, isSitemapRegenerating, setIsSitemapRegenerating, setSitemap } = useProjectStore();
  const { isDomReady, openDevTools, currentUrl } = useWebviewStore();
  const { openSnackbar } = useSnackbarStore();

  const [selectedTab, setSelectedTab] = useState(0);

  const pages = [...selectedTest.random_pages, ...selectedTest.structured_pages];
  const isCurrentPageInSitemap = pages.some(page => compareUrls(currentUrl, page.domain || `${selectedTest.environment.url}/${page.path}`));

  const isLoading = isPageLoading || isTestRescanLoading || isPageRescanLoading || isSitemapRegenerating;

  const handleAddPage = async () => {
    const page = await window.api.environment.createPage({
      id: selectedTest.environment_id,
      url: currentUrl
    });
    if (!page) return;
    await window.api.environmentTest.addPage({
      id: selectedTest.id,
      environment_page_id: page.id,
      type: 'RANDOM'
    });
    const newSitemap = await window.api.environmentTest.getSitemap({ id: selectedTest.id });
    setSitemap(newSitemap);
    setSelectedPage(page);
    scanPage({ ids: [page.id], environment_test_id: selectedTest.id });
  };

  const handleRegenerateSitemap = async () => {
    setIsSitemapRegenerating(true);
    try {
      const res = await window.api.environmentTest.rescanSitemap({ id: selectedTest.id, url: currentUrl });
      openSnackbar({ message: `Regeneration successful. Found ${res.count} page${res.count > 1 ? 's' : ''}`, severity: 'success' });
    } catch {
      openSnackbar({ message: 'Error regenerating sitemap' });
    } finally {
      setIsSitemapRegenerating(false);
    }
  };

  const selectOptions = [{
    label: 'Rescan Page',
    onClick: async () => {
      scanPage({ ids: [selectedPage.id], environment_test_id: selectedTest.id }, { retry: true });
    },
    disabled: isLoading
  }, {
    label: 'Rescan all pages',
    onClick: async () => {
      scanPage({ environment_test_id: selectedTest.id }, { retry: true });
    },
    disabled: isLoading
  }];

  return (
    <Box className={style.root}>
      <Box className={style.tabs}>
        <Tab
          tab={{ label: selectedPage.name }}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          isPageLoading={isPageLoading}
          className={style.selectedPageTab}
          index={0}
        />
      </Box>
      <Box className={style.iconsContainer}>
        <SplitButton options={selectOptions} className={style.splitBtn} />
        <IconButton Icon={filePlus} tooltip='Add page' onClick={handleAddPage} disabled={isLoading || isCurrentPageInSitemap} className={classNames(style.icon, style.addPageIcon)} btnContainerClassName={style.iconBtnContainer} />
        <IconButton Icon={reset} tooltip='Regenerate sitemap' onClick={handleRegenerateSitemap} disabled={isLoading} className={style.icon} btnContainerClassName={style.iconBtnContainer} />
        <IconButton Icon={code} tooltip='Open Devtools' onClick={openDevTools} disabled={!isDomReady} className={classNames(style.icon, style.devtoolsIcon)} btnContainerClassName={style.iconBtnContainer} />
      </Box>
    </Box>
  );
};
export default Tabs;
