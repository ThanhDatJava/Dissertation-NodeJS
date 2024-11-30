"use strict";
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("medicalrecords", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },

      doctorId: {
        type: Sequelize.INTEGER,
      },
      email: {
        type: Sequelize.STRING,
      },
      //head
      medicalFacility: {
        type: Sequelize.STRING,
      },
      hospital: {
        type: Sequelize.STRING,
      },
      storageNumber: {
        type: Sequelize.INTEGER,
      },
      medicalCode: {
        type: Sequelize.INTEGER,
      },
      //administrative
      fullName: {
        type: Sequelize.STRING,
      },

      birthday: {
        type: Sequelize.STRING,
      },

      gender: {
        type: Sequelize.STRING,
      },

      job: {
        type: Sequelize.STRING,
      },

      ethnicGroup: {
        type: Sequelize.STRING,
      },

      address: {
        type: Sequelize.STRING,
      },
      workplace: {
        type: Sequelize.STRING,
      },

      object: {
        type: Sequelize.STRING,
      },

      healthInsurancePeriod: {
        type: Sequelize.STRING,
      },
      cardNumber: {
        type: Sequelize.STRING,
      },
      phoneNumber: {
        type: Sequelize.STRING,
      },

      //patient management
      dateAdmission: {
        type: Sequelize.STRING,
      },
      placeIntroduction: {
        type: Sequelize.STRING,
      },

      dischargeDate: {
        type: Sequelize.STRING,
      },
      totalTreatmentDays: {
        type: Sequelize.STRING,
      },

      //
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("medicalrecords");
  },
};
