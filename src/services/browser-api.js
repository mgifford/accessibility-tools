/**
 * Browser-side window.api shim.
 *
 * This module provides the exact same surface as the Electron preload's
 * contextBridge `api` object, but routes every call to the in-process
 * services layer instead of going through ipcRenderer → ipcMain.
 *
 * It is installed by src/services/init.js when running outside Electron.
 */

import {
  ProjectService,
  EnvironmentService,
  EnvironmentTestService,
  EnvironmentPageService,
  AuditService,
  TestCaseService,
  RemediationService,
  TechnologyService,
  ProfileService,
  AccessibilitySettingsService,
  SystemCategoryService,
  SystemEnvironmentService,
  SystemStandardService,
  AuditTypeService,
  LandmarkService,
  SystemCountryService,
  PageScriptsService,
  AxeCoreService
} from './index';

const api = {
  global: {
    onNavigate: () => () => {}
  },

  theme: {
    set: async (v) => {
      if (typeof localStorage !== 'undefined') localStorage.setItem('colorMode', v);
    },
    current: async () => {
      if (typeof localStorage !== 'undefined') return localStorage.getItem('colorMode') || 'light';
      return 'light';
    },
    setToSystem: () => {}
  },

  project: {
    find: (data, opt) => ProjectService.find(data, opt),
    read: (data, opt) => ProjectService.read(data, opt),
    create: (data, opt) => ProjectService.create(data, opt),
    update: (data, opt) => ProjectService.update(data, opt),
    delete: data => ProjectService.delete(data)
  },

  environment: {
    find: (data, opt) => EnvironmentService.find(data, opt),
    read: (data, opt) => EnvironmentService.read(data, opt),
    create: (data, opt) => EnvironmentService.create(data, opt),
    update: (data, opt) => EnvironmentService.update(data, opt),
    delete: (data, opt) => EnvironmentService.delete(data, opt),
    dnsLookup: (data, opt) => EnvironmentService.dnsLookup(data, opt),
    generateSitemap: (data, opt) => EnvironmentService.generateSitemap(data, opt),
    getSitemap: (data, opt) => EnvironmentService.getSitemap(data, opt),
    createPage: (data, opt) => EnvironmentService.createPage(data, opt)
  },

  environmentTest: {
    find: (data, opt) => EnvironmentTestService.find(data, opt),
    read: (data, opt) => EnvironmentTestService.read(data, opt),
    create: (data, opt) => EnvironmentTestService.create(data, opt),
    update: (data, opt) => EnvironmentTestService.update(data, opt),
    start: (data, opt) => EnvironmentTestService.startTest(data, opt),
    close: (data, opt) => EnvironmentTestService.closeTest(data, opt),
    openClosedTest: (data, opt) => EnvironmentTestService.openClosedTest(data, opt),
    getSitemap: (data, opt) => EnvironmentTestService.getSitemap(data, opt),
    getStats: (data, opt) => EnvironmentTestService.getStats(data, opt),
    generateReport: (data, opt) => EnvironmentTestService.generateReport(data, opt),
    onTestCompleted: () => () => {},
    generateOccurrenceData: (data, opt) => EnvironmentTestService.generateOccurrenceData(data, opt),
    hasOccurrenceData: (data, opt) => EnvironmentTestService.hasOccurrenceData(data, opt),
    addPage: (data, opt) => EnvironmentTestService.addPage(data, opt),
    rescanSitemap: (data, opt) => EnvironmentTestService.rescanSitemap(data, opt)
  },

  environmentPage: {
    scanPage: (data, opt) => EnvironmentPageService.scanPage(data, opt),
    findTestCases: (data, opt) => EnvironmentPageService.findTestCases(data, opt),
    findTestCaseNodes: (data, opt) => EnvironmentPageService.findTestCaseNodes(data, opt),
    readTestCase: (data, opt) => EnvironmentPageService.readTestCase(data, opt),
    findEnvironmentTest: (data, opt) => EnvironmentPageService.findEnvironmentTest(data, opt),
    updateEnvironmentTestTarget: (data, opt) => EnvironmentPageService.updateEnvironmentTestTarget(data, opt),
    generateReport: (data, opt) => EnvironmentPageService.generateReport(data, opt),
    onTestCompleted: () => () => {}
  },

  testCase: {
    find: (data, opt) => TestCaseService.find(data, opt),
    read: (data, opt) => TestCaseService.read(data, opt),
    create: (data, opt) => TestCaseService.create(data, opt),
    update: (data, opt) => TestCaseService.update(data, opt),
    updateIsSelected: (data, opt) => TestCaseService.updateIsSelected(data, opt),
    delete: (data, opt) => TestCaseService.delete(data, opt)
  },

  systemStandard: {
    find: (data, opt) => SystemStandardService.find(data, opt),
    findVersions: (data, opt) => SystemStandardService.findVersions(data, opt),
    findPrinciples: (data, opt) => SystemStandardService.findPrinciples(data, opt),
    findGuidelines: (data, opt) => SystemStandardService.findGuidelines(data, opt),
    findCriteria: (data, opt) => SystemStandardService.findCriteria(data, opt)
  },

  technology: {
    find: (data, opt) => TechnologyService.find(data, opt),
    read: (data, opt) => TechnologyService.read(data, opt),
    create: (data, opt) => TechnologyService.create(data, opt),
    update: (data, opt) => TechnologyService.update(data, opt),
    delete: (data, opt) => TechnologyService.delete(data, opt)
  },

  remediation: {
    find: (data, opt) => RemediationService.find(data, opt),
    read: (data, opt) => RemediationService.read(data, opt),
    create: (data, opt) => RemediationService.create(data, opt),
    update: (data, opt) => RemediationService.update(data, opt),
    updateIsSelected: (data, opt) => RemediationService.updateIsSelected(data, opt),
    delete: (data, opt) => RemediationService.delete(data, opt)
  },

  systemCategory: {
    find: (data, opt) => SystemCategoryService.find(data, opt),
    read: (data, opt) => SystemCategoryService.read(data, opt),
    create: (data, opt) => SystemCategoryService.create(data, opt),
    update: (data, opt) => SystemCategoryService.update(data, opt),
    updateIsSelected: (data, opt) => SystemCategoryService.updateIsSelected(data, opt),
    updatePriority: (data, opt) => SystemCategoryService.updatePriority(data, opt),
    delete: (data, opt) => SystemCategoryService.delete(data, opt)
  },

  systemEnvironment: {
    find: (data, opt) => SystemEnvironmentService.find(data, opt),
    read: (data, opt) => SystemEnvironmentService.read(data, opt),
    create: (data, opt) => SystemEnvironmentService.create(data, opt),
    update: (data, opt) => SystemEnvironmentService.update(data, opt),
    updateIsSelected: (data, opt) => SystemEnvironmentService.updateIsSelected(data, opt),
    delete: (data, opt) => SystemEnvironmentService.delete(data, opt)
  },

  axeCore: {
    getAxeScript: () => AxeCoreService.getAxeScript(),
    getRunScript: () => AxeCoreService.getRunScript(),
    handleResult: data => AxeCoreService.handleResult(data)
  },

  profile: {
    find: (data, opt) => ProfileService.find(data, opt),
    read: (data, opt) => ProfileService.read(data, opt),
    create: (data, opt) => ProfileService.create(data, opt),
    update: (data, opt) => ProfileService.update(data, opt),
    delete: (data, opt) => ProfileService.delete(data, opt)
  },

  systemCountry: {
    find: (data, opt) => SystemCountryService.find(data, opt),
    read: (data, opt) => SystemCountryService.read(data, opt)
  },

  accessibilitySettings: {
    read: () => AccessibilitySettingsService.read(),
    update: data => AccessibilitySettingsService.update(data),
    reset: data => AccessibilitySettingsService.reset(data)
  },

  pageScripts: {
    getFocusScript: (data, opt) => Promise.resolve(PageScriptsService.getFocusScript(data?.selector || '')),
    getRemoveFocusScript: (data, opt) => Promise.resolve(PageScriptsService.getRemoveFocusScript(data?.selector || ''))
  },

  audit: {
    find: (data, opt) => AuditService.find(data, opt),
    read: (data, opt) => AuditService.read(data, opt),
    create: (data, opt) => AuditService.create(data, opt),
    update: (data, opt) => AuditService.update(data, opt),
    delete: (data, opt) => AuditService.delete(data, opt),
    findAuditReportItems: (data, opt) => AuditService.findAuditReportItems(data, opt),
    updateAuditReportItem: (data, opt) => AuditService.updateAuditReportItem(data, opt),
    findAuditTypes: (data, opt) => AuditService.findAuditTypes(data, opt),
    findAuditChapters: (data, opt) => AuditService.findAuditChapters(data, opt),
    getStats: (data, opt) => AuditService.getStats(data, opt),
    generateReport: (data, opt) => _browserGenerateReport(data, opt)
  },

  landmark: {
    find: (data, opt) => LandmarkService.find(data, opt),
    read: (data, opt) => LandmarkService.read(data, opt)
  },

  webview: {
    onNavigate: () => () => {}
  }
};

/**
 * Report generation in the browser: return the data and trigger a download
 * instead of showing a native OS save dialog.
 */
async function _browserGenerateReport(data, opt) {
  const result = await AuditService.generateReport(data, opt);
  if (!result?.audit) return { success: false };
  // The caller is responsible for rendering and downloading.
  return { success: true, ...result };
}

export default api;
