'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TeamMember = sequelize.define('teamMember', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'teams',
        key: 'id'
      }
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('owner', 'member'),
      allowNull: false,
      defaultValue: 'member'
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
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
    tableName: 'team_members',
    timestamps: true,
    indexes: [
      {
        fields: ['teamId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['teamId', 'userId'],
        unique: true
      }
    ]
  });

  TeamMember.associate = function(models) {
    // Associations will be defined in models/associate/config.js
  };

  return TeamMember;
};
