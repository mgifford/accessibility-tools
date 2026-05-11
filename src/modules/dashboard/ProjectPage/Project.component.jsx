import { formatDomain } from '@/electron/lib/utils';
import WebView from '@/modules/core/WebView/WebView.component';
import { useProjectStore, useTerminalStore } from '@/stores';
import { Box, Stack } from '@mui/material';
import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import Tabs from './Tabs.component';

const Project = () => {
  const { project, selectedPage, selectedTest, getTestStats, testRescanNonce, pageRescanNonce, setIsPageRescanLoading, setIsTestRescanLoading } = useProjectStore(useShallow(s => ({
    project: s.project,
    selectedPage: s.selectedPage,
    selectedTest: s.selectedTest,
    getTestStats: s.getTestStats,
    testRescanNonce: s.testRescanNonce,
    pageRescanNonce: s.pageRescanNonce,
    setIsPageRescanLoading: s.setIsPageRescanLoading,
    setIsTestRescanLoading: s.setIsTestRescanLoading
  })));
  const { setFilter, isAudit, setIsAutomatedTestFinished, setIsPolling, setHasOccurrenceData } = useTerminalStore(useShallow(s => ({
    setFilter: s.tests.setFilter,
    isAudit: s.isAudit,
    setIsAutomatedTestFinished: s.setIsAutomatedTestFinished,
    setIsPolling: s.setIsPolling,
    setHasOccurrenceData: s.setHasOccurrenceData
  })));

  const testUnsubRef = useRef(null);
  const pageUnsubRef = useRef(null);

  const cleanupTest = useCallback(() => {
    testUnsubRef.current?.();
    pageUnsubRef.current?.();
    testUnsubRef.current = null;
    pageUnsubRef.current = null;
    setIsTestRescanLoading(false);
  }, []);

  const cleanupPage = useCallback(() => {
    pageUnsubRef.current?.();
    pageUnsubRef.current = null;
    setIsPolling(false);
    setIsPageRescanLoading(false);
  }, []);

  const canResolve = selectedPage?.id && selectedPage?.id !== 'HOME' && selectedTest?.id;

  const pollTestData = useCallback(async ({ assumeRunning = false } = {}) => {
    cleanupTest();
    setIsAutomatedTestFinished(false);

    const getHasOccurrenceData = async () => {
      const hasData = await window.api.environmentTest.hasOccurrenceData({ id: selectedTest?.id });
      setHasOccurrenceData(hasData);
    };

    const isTestFinished = async () => {
      const environmentTest = await window.api.environmentTest.read({
        id: selectedTest?.id
      });
      return !!environmentTest.end_date;
    };

    const finished = assumeRunning ? false : await isTestFinished();
    if (finished) {
      setIsAutomatedTestFinished(true);
      getTestStats(selectedTest?.id);
      getHasOccurrenceData();
      return;
    }

    setIsTestRescanLoading(true);
    testUnsubRef.current = window.api.environmentTest.onTestCompleted(({ status, data }) => {
      if (data.test_id !== selectedTest?.id) return;
      if (status === 'error') {
        window.system.showError('Test failed. Please try again or contact support.');
      } else {
        getHasOccurrenceData();
      }
      setIsAutomatedTestFinished(true);
      cleanupTest();
    });
  }, [selectedTest?.id, cleanupTest]);

  const pollPageData = useCallback(async ({ assumeRunning = false } = {}) => {
    cleanupPage();
    if (isAudit) {
      setIsPolling(false);
      return;
    }
    if (!canResolve) return;

    const handleDataFetchCompleted = () => {
      setFilter({ status: 'FAIL' });
    };

    const isPageTestFinished = async () => {
      const environmentTest = await window.api.environmentPage.findEnvironmentTest({
        environment_page_id: selectedPage?.id,
        environment_test_id: selectedTest?.id
      });
      return !!environmentTest?.end_date;
    };

    const isCompleted = assumeRunning ? false : await isPageTestFinished();
    if (isCompleted) {
      handleDataFetchCompleted();
      return;
    }

    setIsPolling(true);
    setIsPageRescanLoading(true);
    pageUnsubRef.current = window.api.environmentPage.onTestCompleted(({ data }) => {
      if (data.test_id === selectedTest?.id) {
        getTestStats(selectedTest.id);
      }
      if (data.page_id !== selectedPage?.id || data.test_id !== selectedTest?.id) return;
      handleDataFetchCompleted();
      cleanupPage();
    });
  }, [selectedTest?.id, selectedPage?.id, isAudit, canResolve, cleanupPage]);

  useEffect(() => {
    if (!selectedTest?.id) return;
    pollTestData({ assumeRunning: testRescanNonce > 0 });
    return cleanupTest;
  }, [selectedTest?.id, testRescanNonce, pollTestData, cleanupTest]);

  useEffect(() => {
    if (!selectedTest?.id || !selectedPage?.id) return;
    pollPageData({ assumeRunning: pageRescanNonce > 0 });
    return cleanupPage;
  }, [selectedTest?.id, selectedPage?.id, pageRescanNonce, pollPageData, cleanupPage]);

  if (!project || !selectedTest) return null;

  const url = selectedPage.domain ? formatDomain(selectedPage.domain) : selectedTest.environment.url;
  const pagePath = `${url}/${selectedPage.path}`;
  return (
    <Stack height='100%' width='100%'>
      <Tabs />
      <Box height='100%' width='100%' flex={1}>
        <WebView url={pagePath} captureScreenshot={!project.image} projectId={project.id} />
      </Box>
    </Stack>
  );
};
export default Project;
