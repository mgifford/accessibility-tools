import log from 'electron-log';
import fs from 'fs-extra';
import Joi from 'joi';
import path from 'path';
import sequelize, { getModel } from './db';
import joiLib from './joi';
import SettingsLib, { ARCHIVE_TYPES } from './settings';

const CHUNK_SIZE = 1000;

class ArchiveLib {
  /**
   * moves the test data to a json file, and deletes all test associations.
   * if archive file already exists, do nothing
   * doesn't delete the test row for any future lookups.
   * the data includes data of the test from the following tables:
   *  - environmentTest
   *  - environmentPage (structured and random pages)
   *  - testCaseEnvironmentTestPage (test cases for the test)
   *  - testCaseEnvironmentTestPageTarget (test case targets / nodes for the test)
   * @param {Object} input
   * @param {string} input.id - the id of the test
   * @param {{}} [opt]
   *  */
  static async archiveTest(input = {}, opt = {}) {
    const schema = joiLib.schema(() =>
      Joi.object({
        id: Joi.id().required()
      })
    );
    const data = await joiLib.validate(schema, input);
    try {
      const EnvironmentTest = getModel('environmentTest'),
        EnvironmentPage = getModel('environmentPage'),
        TestCaseEnvironmentTestPage = getModel('testCaseEnvironmentTestPage'),
        TestCaseEnvironmentTestPageTarget = getModel('testCaseEnvironmentTestPageTarget'),
        TestPageTargetOccurrence = getModel('testPageTargetOccurrence');

      // get the test without test cases and nodes per page to avoid overloading the query
      const test = await EnvironmentTest.findByPk(data.id, {
        attributes: ['id', 'status'],
        include: [
          {
            model: EnvironmentPage,
            as: 'structured_pages',
            attributes: ['id']
          },
          {
            model: EnvironmentPage,
            as: 'random_pages',
            attributes: ['id']
          }
        ]
      });
      if (!test) {
        throw new Error('environment test not found');
      }

      const archiveFolder = await SettingsLib.getArchiveTypeFolderPath(ARCHIVE_TYPES.TEST);
      const archiveFilePath = path.join(archiveFolder, `${test.id}.json`);
      if (fs.existsSync(archiveFilePath)) {
        throw new Error('environment test already archived');
      }

      let output = test.toJSON();

      const getDataInChunks = async (ids, fieldName, model, chunkSize = CHUNK_SIZE) => {
        let data = [];
        let offset = 0;
        let shouldFetchMore = true;
        while (shouldFetchMore) {
          const items = await model.findAll({
            where: { [fieldName]: ids },
            limit: chunkSize,
            offset: offset,
            raw: true
          });
          if (items.length === 0) {
            shouldFetchMore = false;
          } else {
            data = data.concat(items);
            offset += chunkSize;
          }
        }
        return data;
      };

      const testCases = await getDataInChunks(data.id, 'environment_test_id', TestCaseEnvironmentTestPage);
      const targets = await getDataInChunks(testCases.map(tc => tc.id), 'test_case_page_id', TestCaseEnvironmentTestPageTarget);
      const occurrences = await getDataInChunks(targets.map(tc => tc.id), 'page_target_id', TestPageTargetOccurrence);

      output.test_cases = testCases;
      output.targets = targets;
      output.occurrences = occurrences;

      await test.destroyAssociations();
      fs.writeFileSync(archiveFilePath, JSON.stringify(output, null, 2));
      log.info(`environment test ${test.id} archived successfully`);
    } catch (e) {
      log.error('Error archiving environment test');
      log.debug(e);
      throw e;
    }
  }

  /**
   * gets test data from archive file and populates the data in the db, then deletes the archive file.
   * if archive file does not exist, does nothing
   * @param {Object} input
   * @param {string} input.id - the id of the test
   * @param {*} opt
   */
  static async unarchiveTest(input = {}, opt = {}) {
    const schema = joiLib.schema(() =>
      Joi.object({
        id: Joi.id().required()
      })
    );
    const data = await joiLib.validate(schema, input);
    try {
      const EnvironmentTest = getModel('environmentTest'),
        EnvironmentTestPage = getModel('environmentTestPage'),
        TestCaseEnvironmentTestPage = getModel('testCaseEnvironmentTestPage'),
        TestCaseEnvironmentTestPageTarget = getModel('testCaseEnvironmentTestPageTarget'),
        TestPageTargetOccurrence = getModel('testPageTargetOccurrence');
      const archiveFolder = await SettingsLib.getArchiveTypeFolderPath(ARCHIVE_TYPES.TEST);
      const archiveFilePath = path.join(archiveFolder, `${data.id}.json`);
      if (!fs.existsSync(archiveFilePath)) {
        throw new Error('Environment test not archived');
      }
      const testData = JSON.parse(fs.readFileSync(archiveFilePath));
      const { structured_pages, random_pages, test_cases, targets, occurrences, status } = testData;
      await sequelize.transaction(async (t) => {
        const testObj = await EnvironmentTest.findByPk(data.id, { transaction: t });
        if (!testObj) {
          throw new Error('environment test not found');
        }
        testObj.status = status;
        const pageDataToAdd = [];
        for (const page of [...structured_pages, ...random_pages]) {
          const { ...rest } = page.environmentTestPage;
          pageDataToAdd.push(rest);
        }
        await Promise.all([
          EnvironmentTestPage.bulkCreate(pageDataToAdd, { transaction: t }),
          TestCaseEnvironmentTestPage.bulkCreate(test_cases, { transaction: t, hooks: false }),
          TestCaseEnvironmentTestPageTarget.bulkCreate(targets, { transaction: t }),
          TestPageTargetOccurrence.bulkCreate(occurrences, { transaction: t })
        ]);
        await testObj.save({ transaction: t });
      });
      fs.unlinkSync(archiveFilePath);
      log.info(`environment test ${data.id} unarchived successfully`);
    } catch (e) {
      log.error(`Error unarchiving environment test ${data.id}`);
      log.debug(e);
    }
  }

  /**
   * Deletes archives by their ids.
   * @param {Object} input
   * @param {string[]} input.ids - The ids of the archive files
   * @param {string} [input.type] - The type of the archive
   * @param {{}} opt
   */
  static async deleteArchive(input = {}, opt = {}) {
    const schema = joiLib.schema(() =>
      Joi.object({
        ids: Joi.array().items(Joi.string()).required(),
        type: Joi.enum(Object.keys(ARCHIVE_TYPES)).optional().default(ARCHIVE_TYPES.TEST)
      })
    );
    const data = await joiLib.validate(schema, input);
    try {
      const archiveFolder = await SettingsLib.getArchiveTypeFolderPath(data.type);
      const promises = [];
      for (const id of data.ids) {
        const filePath = path.join(archiveFolder, `${id}.json`);
        if (fs.existsSync(filePath)) {
          promises.push(fs.unlinkSync(filePath));
        }
      }
      await Promise.all(promises);
      log.info(`${promises.length} archives deleted successfully`);
      return { success: true, message: `${promises.length} archives deleted successfully` };
    } catch (e) {
      log.error('Error deleting archives: ', e);
      return { success: false, message: 'Error deleting archives' };
    }
  }
}

export default ArchiveLib;
