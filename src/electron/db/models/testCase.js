export const TEST_CASE_TYPE_VALUES = ['MANUAL', 'AUTOMATIC'];

const beforeDestroy = async (models, testCase, options) => {
  const transaction = options.transaction;
  const { id } = testCase;
  const testCaseEnvironmentTestPages = await models.testCaseEnvironmentTestPage.findAll({
    where: { test_case_id: id },
    transaction
  });
  const testCaseEnvironmentTestPageIds = testCaseEnvironmentTestPages.map(testCaseEnvironmentTestPage => testCaseEnvironmentTestPage.id);
  const testCaseEnvironmentTestPageTargets = await models.testCaseEnvironmentTestPageTarget.findAll({
    where: { test_case_page_id: testCaseEnvironmentTestPageIds },
    transaction
  });
  const testCaseEnvironmentTestPageTargetIds = testCaseEnvironmentTestPageTargets.map(testCaseEnvironmentTestPageTarget => testCaseEnvironmentTestPageTarget.id);
  await models.testPageTargetOccurrence.destroy({
    where: { page_target_id: testCaseEnvironmentTestPageTargetIds },
    transaction
  });
  await models.testCaseEnvironmentTestPageTarget.destroy({
    where: { test_case_page_id: testCaseEnvironmentTestPageIds },
    transaction
  });
  await models.testCaseEnvironmentTestPage.destroy({
    where: { test_case_id: id },
    transaction
  });
};

export default (sequelize, DataTypes) => {
  const TestCase = sequelize.define('testCase', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM,
      values: TEST_CASE_TYPE_VALUES,
      defaultValue: TEST_CASE_TYPE_VALUES[0]
    },
    steps: {
      type: DataTypes.TEXT
    },
    result: {
      type: DataTypes.TEXT
    },
    instruction: {
      type: DataTypes.TEXT
    },
    selectors: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: ['body']
    },
    is_selected: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  TestCase.addHook('beforeDestroy', async (testCase, options) => {
    await beforeDestroy(sequelize.models, testCase, options);
  });

  TestCase.associate = (models) => {
    TestCase.belongsTo(models.systemStandard, {
      foreignKey: 'system_standard_id',
      as: 'standard'
    });
    TestCase.belongsTo(models.systemCategory, {
      foreignKey: 'system_category_id',
      as: 'category'
    });
    TestCase.hasMany(models.testCaseEnvironmentTestPage, {
      foreignKey: 'test_case_id',
      as: 'pages'
    });
    TestCase.belongsToMany(models.remediation, {
      foreignKey: 'test_case_id',
      as: 'remediations',
      through: 'test_case_remediations'
    });
    TestCase.belongsToMany(models.systemAxeRules, {
      foreignKey: 'test_case_id',
      as: 'rules',
      through: 'test_case_axe_rules'
    });
    TestCase.belongsToMany(models.systemStandardCriteria, {
      foreignKey: 'test_case_id',
      as: 'criteria',
      through: 'test_case_criteria'
    });
  };

  return TestCase;
};
