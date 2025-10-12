'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TeamEvent = sequelize.define('teamEvent', {
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
    eventName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    eventDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('planned', 'active', 'completed'),
      allowNull: false,
      defaultValue: 'planned'
    },
    assignedMembers: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
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
    tableName: 'team_events',
    timestamps: true,
    indexes: [
      {
        fields: ['teamId']
      },
      {
        fields: ['eventDate']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdBy']
      }
    ]
  });

  TeamEvent.associate = function(models) {
    // Associations will be defined in models/associate/config.js
  };

  return TeamEvent;
};

