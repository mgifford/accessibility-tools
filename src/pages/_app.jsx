import '@/constants/app.global.scss';
import { condensed, mono, roboto } from '@/constants/fonts';
import Snackbar from '@/modules/core/Snackbar';
import UiProvider from '@/modules/core/UiProvider';
import { initBrowserApi } from '@/services/init';
import { useAccessibilityStore, useSystemStore, useUiStore } from '@/stores';
import { AppCacheProvider } from '@mui/material-nextjs/v14-pagesRouter';
import { ThemeProvider } from '@mui/material/styles';
import classNames from 'classnames';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function MyApp(props) {
  const { Component, pageProps } = props;
  const { theme } = useUiStore();
  const [apiReady, setApiReady] = useState(false);

  // When running in a browser (not Electron), install the browser API shim
  // and seed the IndexedDB on first visit before any window.api calls fire.
  useEffect(() => {
    const setup = async () => {
      if (typeof window !== 'undefined' && !window.api) {
        await initBrowserApi();
      }
      setApiReady(true);
    };
    setup();
  }, []);
  const {
    standards,
    setStandards,
    criteria,
    setCriteria,
    categories,
    setCategories,
    technologies,
    setTechnologies,
    environments,
    setEnvironments,
    countries,
    setCountries,
    auditTypes,
    setAuditTypes,
    landmarks,
    setLandmarks,
    imageBasePath,
    setImageBasePath
  } = useSystemStore();
  const { init } = useAccessibilityStore();
  const router = useRouter();

  // set standards
  useEffect(() => {
    if (!apiReady) return;
    if (standards && standards.length > 0) {
      return;
    }
    const getStandards = async () => {
      const systemStandardsRes = await window.api.systemStandard.find({ limit: false }, { detailed: true });
      const systemStandards = systemStandardsRes.result;
      setStandards(systemStandards);
    };
    getStandards();
  }, [apiReady]);

  // set criteria
  useEffect(() => {
    if (!apiReady) return;
    if (criteria && criteria.length > 0) {
      return;
    }
    const getCriteria = async () => {
      const criteriaRes = await window.api.systemStandard.findCriteria({ limit: false });
      const criteria = criteriaRes.result;
      setCriteria(criteria);
    };
    getCriteria();
  }, [apiReady]);

  // set categories
  useEffect(() => {
    if (!apiReady) return;
    if (categories && categories.length > 0) {
      return;
    }
    const getCategories = async () => {
      const categoriesRes = await window.api.systemCategory.find({ limit: false }, { detailed: true });
      const categories = categoriesRes.result;
      setCategories(categories);
    };
    getCategories();
  }, [apiReady]);

  // set technologies
  useEffect(() => {
    if (!apiReady) return;
    if (technologies && technologies.length > 0) {
      return;
    }
    const getTechnologies = async () => {
      const technologiesRes = await window.api.technology.find({ limit: false }, { detailed: true });
      const technologies = technologiesRes.result;
      setTechnologies(technologies);
    };
    getTechnologies();
  }, [apiReady]);

  // set envs
  useEffect(() => {
    if (!apiReady) return;
    if (environments && environments.length > 0) {
      return;
    }
    const getEnvironments = async () => {
      const envRes = await window.api.systemEnvironment.find({ limit: false }, { detailed: true });
      const envs = envRes.result;
      setEnvironments(envs);
    };
    getEnvironments();
  }, [apiReady]);

  // set countries
  useEffect(() => {
    if (!apiReady) return;
    if (countries && countries.length > 0) {
      return;
    }
    const getCountries = async () => {
      const countriesRes = await window.api.systemCountry.find({ limit: false }, { detailed: true });
      const countries = countriesRes.result;
      setCountries(countries);
    };
    getCountries();
  }, [apiReady]);

  // set audit types
  useEffect(() => {
    if (!apiReady) return;
    if (auditTypes && auditTypes.length > 0) {
      return;
    }
    const getAuditTypes = async () => {
      const auditTypesRes = await window.api.audit.findAuditTypes({ limit: false }, { detailed: true });
      const auditTypes = auditTypesRes.result;
      setAuditTypes(auditTypes);
    };
    getAuditTypes();
  }, [apiReady]);

  // set landmarks
  useEffect(() => {
    if (!apiReady) return;
    if (landmarks && landmarks.length > 0) {
      return;
    }
    const getLandmarks = async () => {
      const landmarksRes = await window.api.landmark.find({ limit: false }, { detailed: true });
      const landmarks = landmarksRes.result;
      setLandmarks(landmarks);
    };
    getLandmarks();
  }, [apiReady]);

  // init accessibility settings
  useEffect(() => {
    if (!apiReady) return;
    const initSettings = async () => {
      const settings = await window.api.accessibilitySettings.read();
      await init(settings);
    };
    initSettings();
  }, [apiReady]);

  useEffect(() => {
    if (!apiReady) return;
    if (imageBasePath) {
      return;
    }
    const setBasePath = async () => {
      const basePath = await window.system.getAssetsPath();
      setImageBasePath(basePath);
    };
    setBasePath();
  }, [apiReady]);

  useEffect(() => {
    if (!apiReady) return;
    window.addEventListener('error', e => window.system.log.error(e.error));
    window.addEventListener('unhandledrejection', e => window.system.log.rejection(e.reason));

    const removeNavigateListener = window.api.global?.onNavigate((path) => {
      router.push(path);
    });

    return () => {
      window.removeEventListener('error', e => window.system.log.error(e.error));
      window.removeEventListener('unhandledrejection', e => window.system.log.rejection(e.reason));
      removeNavigateListener?.();
    };
  }, [apiReady]);

  return (
    <>
      <style jsx global>
        {`
          :root {
            --font-roboto: ${roboto.style.fontFamily};
            --font-roboto-mono: ${mono.style.fontFamily};
            --font-roboto-condensed: ${condensed.style.fontFamily};
          }
        `}
      </style>
      <div className={classNames(roboto.className, mono.className, condensed.className)} />
      <AppCacheProvider {...props}>
        <UiProvider>
          <ThemeProvider theme={theme}>
            <Head>
              <title>Accessibility Tools</title>
              <meta name='viewport' content='minimum-scale=1, initial-scale=1, width=device-width' />
              <link rel='shortcut icon' href={`${imageBasePath}/favicon.png`} />
            </Head>
            <main className={roboto.variable}>
              <Component {...pageProps} />
              <Snackbar />
            </main>
          </ThemeProvider>
        </UiProvider>
      </AppCacheProvider>
    </>
  );
}
