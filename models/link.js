const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Link = sequelize.define(
    "Link",
    {
      code: {
        type: DataTypes.STRING(8),
        allowNull: false,
        primaryKey: true,
      },
      targetUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: "target_url",
      },
      clicks: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lastClicked: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_clicked",
      },
    },
    {
      tableName: "links",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    }
  );

  return Link;
};
