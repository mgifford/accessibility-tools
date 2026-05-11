import { format } from 'date-fns';

/**
 * Validate a domain name
 * @param {string} domain - the domain name to validate
 * @returns - true if the domain name is valid, false otherwise
 */
export const isDomainValid = (domain = '') => {
  const domainPattern = /^(https?:\/\/)?(localhost|(([\w-]+\.)+[\w-]+)|(\d{1,3}\.){3}\d{1,3})(:\d+)?(\/\S*)?$/i;
  return domainPattern.test(domain.trim());
};

/**
 * Format a domain name
 * If strip is true, the domain is returned without any protocol or www prefix.
 * Otherwise, if the domain doesn't have protocol, a protocol is added.
 * @param {string} domain - the domain name to format
 * @param {boolean} [strip=false] - whether to strip the protocol and www prefix
 * @returns - the formatted domain name
 */
export const formatDomain = (domain = '', strip = false) => {
  if (strip) {
    return domain.replace(/^(https?:\/\/)?(www\.)?/, '');
  }
  if (!domain.startsWith('http')) {
    return domain.startsWith('localhost') ? `http://${domain}` : `https://${domain}`;
  }
  return domain;
};

/**
 * Compares two URLs to see if they have the same hostname.
 * The URLs are first formatted to remove any protocol and www prefix.
 * Then the hostname is extracted from the formatted URLs and compared.
 * @param {string} url1 - the first URL to compare
 * @param {string} url2 - the second URL to compare
 * @returns - true if the hostnames are the same, false otherwise
 */
export const compareHostnames = (url1, url2) => {
  try {
    const normalizedUrl1 = formatDomain(formatDomain(url1, true));
    const normalizedUrl2 = formatDomain(formatDomain(url2, true));
    const hostname1 = new URL(normalizedUrl1).hostname;
    const hostname2 = new URL(normalizedUrl2).hostname;
    return hostname1 === hostname2;
  } catch (e) {
    return false;
  }
};

/**
 * Compares two URLs to see if they have the same origin and path.
 * The URLs are first formatted to remove any protocol and www prefix.
 * Then the origin and path are extracted from the formatted URLs and compared.
 * @param {string} url1 - the first URL to compare
 * @param {string} url2 - the second URL to compare
 * @returns - true if the origins and paths are the same, false otherwise
 */
export const compareUrls = (url1, url2) => {
  try {
    const urlObj1 = new URL(formatDomain(url1));
    const urlObj2 = new URL(formatDomain(url2));
    return `${urlObj1.origin}${urlObj1.pathname}` === `${urlObj2.origin}${urlObj2.pathname}`;
  } catch (e) {
    return false;
  }
};

/**
   * Performs a url checkup on the provided URL.
   * @param {string} url - The URL to perform checkup on.
   * @returns - an object containing a success key set to true if successful, or false if failed and an error message.
   */
export const urlExists = async (url = '') => {
  try {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(formatDomain(url));

      const options = {
        method: 'HEAD',
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        port: urlObj.port || 443
      };

      const isHttps = urlObj.protocol === 'https:';
      const transport = isHttps ? require('https') : require('http');

      const req = transport.request(options, (res) => {
        resolve({ success: res.statusCode < 400 });
      });
      req.on('error', reject);
      req.end();
    });
  } catch (e) {
    console.log(`URL check failed for ${data.url}`);
    return { success: false, error: e.message };
  }
};

/**
 * Generates a string id with a given number and prefix.
 * The id will be padded with zeros to the given length.
 * @param {number} number - the number to generate the id with
 * @param {string} [prefix] - the prefix to add to the number
 * @param {number} [zeros] - the number of zeros to pad the id with
 * @return {string} the generated id
 */
export const generateId = (number, prefix = '0', zeros = 4) => {
  return `${prefix}${number.toString().padStart(zeros, '0')}`;
};

/**
 * Generates a string label for the given array by displaying the first x items and adding a label with the remaining count.
 * @param {array} items - the items to generate the label for
 * @param {number} [count] - the number of items to display
 * @param {string} [separator] - the separator to use between the displayed items
 * @return {string} the generated label
 */
export const getArrayTruncatedLabel = (items, count = 2, separator = ', ') => {
  if (!Array.isArray(items) || items.length === 0) return '';
  if (items.length <= count) return items.join(separator);
  const visibleItems = items.slice(0, count).join(separator);
  const remainingCount = items.length - count;
  return `${visibleItems}${separator} +${remainingCount}`;
};

/**
 * Formats the given date into a string with the format MMM d, yyyy (e.g. May 1, 2020).
 * @param {Date} date - the date to format
 * @return {string} the formatted date string
 */
export const formatDate = (date, dateFormat = 'MMM d, yyyy') => {
  if (!date) return '';
  return format(date, dateFormat);
};

/**
 * Fixes the targets of a test case
 * @param {Object} tc - the test case
 * @return the updated test case
 */
export const fixTcTargets = (tc) => {
  const targetMap = {};

  for (const item of tc.targets) {
    const targetId = item.target.id;
    if (!targetMap[targetId]) {
      targetMap[targetId] = { name: item.target.name, formats: new Map() };
    }
    if (item.format && item.format.id) {
      targetMap[targetId].formats.set(item.format.id, item.format.name);
    }
  }

  const system_targets = [];
  for (const targetId in targetMap) {
    system_targets.push({
      id: targetId,
      name: targetMap[targetId].name,
      formats: Array.from(targetMap[targetId].formats, ([id, name]) => ({ id, name }))
    });
  }

  tc.system_targets = system_targets;
  delete tc.targets;

  return tc;
};

/**
 * Returns a promise that resolves or rejects when the given promise resolves or rejects,
 * or rejects when the given timeout is reached (whichever happens first).
 * @param {Promise} promise - the promise to monitor
 * @param {number} [timeout] - the timeout in milliseconds (default: 5000)
 */
export const timeoutFn = async (promise, timeout = 5000) => {
  const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Operation timed out')), timeout));
  return Promise.race([promise, timeoutPromise]);
};

/**
 * Converts a string into an ID format by trimming whitespace,
 * converting to uppercase, and replacing spaces with underscores.
 * @param {string} str - The string to convert into an ID.
 * @return {string} The converted string in ID format.
 */
export const convertToId = (str) => {
  return str.trim().toUpperCase().replace(/\s+/g, '_');
};

/**
 * Chunks an array into smaller arrays of a given size.
 * @param {array} [array] - The array to chunk.
 * @param {number} [size] - The size of each chunk. Defaults to 10.
 * @return - A new array of arrays, each containing a chunk of the given size.
 */
export const chunkArray = (array = [], size = 10) => {
  if (!Array.isArray(array) || array.length === 0 || size <= 0) return [];
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Converts a given string into a case format.
 * @param {string} str - The string
 * @param {'camel'|'kebab'|'capitalized'} [format] - The case format to use
 * @return - The converted string in the given case format.
 */
export const strToCase = (str, format) => {
  if (!str) return '';
  if (format === 'camel') {
    return str
      .toLowerCase()
      .split(/[\s_-]+/)
      .map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
      .join('');
  }
  if (format === 'kebab') {
    return str.toLowerCase().replace(/[ :]/g, '-').replace(/[()]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }
  if (format === 'capitalized') {
    return str[0].toUpperCase() + str.slice(1).toLowerCase();
  }
  return str;
};

/**
 * Returns the partition string for the given URL, to be used in BrowserWindow to persist session.
 * @param {string} url
 * @return - The partition string
 */
export const getUrlPartitionString = (url) => {
  try {
    const urlObj = new URL(formatDomain(url));
    const partition = `persist:${urlObj.hostname}`;
    return partition;
  } catch {
    return url;
  }
};
