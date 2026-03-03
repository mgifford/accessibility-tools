const beforeCreate = async (models, testCaseEnvironmentTestPage, options) => {
  const transaction = options.transaction;
  const { test_case_id, environment_test_id, environment_page_id } = testCaseEnvironmentTestPage;
  const isValidPage = await models.environmentPage.findOne(
    {
      where: { id: environment_page_id },
      include: [{ model: models.environmentTest, as: 'tests', where: { id: environment_test_id } }],
      transaction
    }
  );
  if (!isValidPage) {
    throw new Error('Invalid environment page and environment test combination');
  }
  if (!testCaseEnvironmentTestPage.status) {
    const testCase = await models.testCase.findOne({ where: { id: test_case_id } });
    const tcType = testCase.type;
    testCaseEnvironmentTestPage.status = tcType === 'MANUAL' ? 'MANUAL' : 'IN_PROGRESS';
  }
};

const beforeDestroy = async (models, obj, options) => {
  const transaction = options.transaction;
  const { id } = obj;
  const testCaseEnvironmentTestPageTargets = await models.testCaseEnvironmentTestPageTarget.findAll({
    where: { test_case_page_id: id },
    transaction
  });
  const testCaseEnvironmentTestPageTargetIds = testCaseEnvironmentTestPageTargets.map(testCaseEnvironmentTestPageTarget => testCaseEnvironmentTestPageTarget.id);
  await models.testPageTargetOccurrence.destroy({
    where: { page_target_id: testCaseEnvironmentTestPageTargetIds },
    transaction
  });
  await models.testCaseEnvironmentTestPageTarget.destroy({
    where: { test_case_page_id: id },
    transaction
  });
};

export const TEST_CASE_PAGE_STATUS_VALUES = ['PASS', 'FAIL', 'ERROR', 'NOT_APPLICABLE', 'INCOMPLETE', 'IN_PROGRESS', 'MANUAL'];

export default (sequelize, DataTypes) => {
  const TestCaseEnvironmentPage = sequelize.define(
    'testCaseEnvironmentTestPage',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      status: {
        type: DataTypes.ENUM,
        values: TEST_CASE_PAGE_STATUS_VALUES
      },
      test_case_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      environment_page_id: {
        type: DataTypes.UUID,
        allowNull: false
      },
      environment_test_id: {
        type: DataTypes.UUID,
        allowNull: false
      }
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['test_case_id', 'environment_page_id', 'environment_test_id'] // Composite unique key
        }
      ]
    }
  );

  TestCaseEnvironmentPage.addHook('beforeCreate', async (testCaseEnvironmentTestPage, options) => {
    await beforeCreate(sequelize.models, testCaseEnvironmentTestPage, options);
  });
  TestCaseEnvironmentPage.addHook('beforeBulkCreate', async (testCaseEnvironmentPages, options) => {
    const promises = [];
    for (const testCaseEnvironmentTestPage of testCaseEnvironmentPages) {
      promises.push(beforeCreate(sequelize.models, testCaseEnvironmentTestPage, options));
    }
    await Promise.all(promises);
  });
  TestCaseEnvironmentPage.addHook('beforeDestroy', async (testCaseEnvironmentTestPage, options) => {
    await beforeDestroy(sequelize.models, testCaseEnvironmentTestPage, options);
  });

  TestCaseEnvironmentPage.associate = (models) => {
    TestCaseEnvironmentPage.belongsTo(models.testCase, {
      foreignKey: 'test_case_id',
      as: 'test_case'
    });
    TestCaseEnvironmentPage.belongsTo(models.environmentPage, {
      foreignKey: 'environment_page_id',
      as: 'environment_page'
    });
    TestCaseEnvironmentPage.belongsTo(models.environmentTest, {
      foreignKey: 'environment_test_id',
      as: 'environment_test'
    });
    TestCaseEnvironmentPage.hasMany(models.testCaseEnvironmentTestPageTarget, {
      foreignKey: 'test_case_page_id',
      as: 'targets'
    });
  };

  return TestCaseEnvironmentPage;
};
