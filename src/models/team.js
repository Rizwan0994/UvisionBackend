'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Team = sequelize.define('team', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 4,
      validate: {
        min: 1,
        max: 4
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'teams',
    timestamps: true,
    indexes: [
      {
        fields: ['ownerId']
      },
      {
        fields: ['isActive']
      }
    ]
  });

  Team.associate = function(models) {
    // Associations will be defined in models/associate/config.js
  };

  return Team;
};
