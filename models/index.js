const { sequelize } = require("./db");
const LinkModel = require("./link");

const Link = LinkModel(sequelize);

module.exports = {
  sequelize,
  Link,
};
