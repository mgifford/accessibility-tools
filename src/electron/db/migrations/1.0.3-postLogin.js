export default {
  up: async (queryInterface, Sequelize) => {
    const TestCaseEnvironmentTestPageTarget = queryInterface.sequelize.models.testCaseEnvironmentTestPageTarget;
    const tableName = TestCaseEnvironmentTestPageTarget.getTableName();
    return queryInterface.sequelize.transaction(async (t) => {
      await Promise.all([
        // add is_manually_reviewed column
        queryInterface.addColumn(tableName, 'is_manually_reviewed', {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        }, {
          transaction: t
        })
      ]);
    });
  },
  down: async (queryInterface, Sequelize) => {
    const EnvironmentPage = queryInterface.sequelize.models.environmentPage;
    const tableName = EnvironmentPage.getTableName();
    return queryInterface.sequelize.transaction((t) => {
      return Promise.all([
        // remove is_manually_reviewed column
        queryInterface.removeColumn(tableName, 'is_manually_reviewed', {
          transaction: t
        })
      ]);
    });
  }
};
