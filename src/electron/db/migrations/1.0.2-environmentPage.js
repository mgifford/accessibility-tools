export default {
  up: async (queryInterface, Sequelize) => {
    const EnvironmentPage = queryInterface.sequelize.models.environmentPage;
    const tableName = EnvironmentPage.getTableName();
    return queryInterface.sequelize.transaction(async (t) => {
      await Promise.all([
        // add domain column
        queryInterface.addColumn(tableName, 'domain', {
          type: Sequelize.STRING
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
        // remove domain column
        queryInterface.removeColumn(tableName, 'domain', {
          transaction: t
        })
      ]);
    });
  }
};
