/**
 * axecore service stub for browser.
 * Live scanning is not available in the browser (no <webview> tag).
 * Results should be imported from GitHub Actions scan outputs.
 */
class AxeCoreService {
  static async getAxeScript() {
    return '/* axe-core live scanning is not available in the browser. Import results from GitHub Actions. */';
  }

  static async getRunScript() {
    return '/* axe-core live scanning is not available in the browser. */';
  }

  static async handleResult() {
    console.warn('axeCore.handleResult: live scanning is not available in the browser.');
    return { success: false, message: 'Live scanning not available. Import results from GitHub Actions.' };
  }
}

export default AxeCoreService;
