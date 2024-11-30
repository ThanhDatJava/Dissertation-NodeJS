"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Medicalrecords extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }

  Medicalrecords.init(
    {
      doctorId: DataTypes.INTEGER,
      email: DataTypes.STRING,
      //head
      medicalFacility: DataTypes.TEXT,
      hospital: DataTypes.TEXT,
      storageNumber: DataTypes.TEXT,
      medicalCode: DataTypes.TEXT,
      //
      //administrative
      fullName: DataTypes.TEXT,
      birthday: DataTypes.TEXT,
      gender: DataTypes.TEXT,
      job: DataTypes.TEXT,
      ethnicGroup: DataTypes.TEXT,
      address: DataTypes.TEXT("long"),
      workplace: DataTypes.TEXT,
      object: DataTypes.TEXT,
      healthInsurancePeriod: DataTypes.TEXT,
      cardNumber: DataTypes.TEXT,
      phoneNumber: DataTypes.TEXT,
      //

      //patient management
      dateAdmission: DataTypes.TEXT,
      placeIntroduction: DataTypes.TEXT,
      dischargeDate: DataTypes.TEXT,
      totalTreatmentDays: DataTypes.TEXT,
      //
    },
    {
      sequelize,
      modelName: "Medicalrecords",
    }
  );
  return Medicalrecords;
};
