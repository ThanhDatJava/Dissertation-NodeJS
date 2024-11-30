import db from "../models/index";
import _ from "lodash";
import emailService from "../services/emailService";
import { where } from "sequelize";
const { Sequelize, sequelize } = require("../models");
require("dotenv").config();

const MAX_NUMBER_SCHEDULE = process.env.MAX_NUMBER_SCHEDULE;

let getTopDoctorHome = (limitInput) => {
  return new Promise(async (resolve, reject) => {
    try {
      let users = await db.User.findAll({
        limit: limitInput,
        where: { roleId: "R2" },
        order: [["createdAt", "DESC"]],
        attributes: {
          exclude: ["password"],
        },
        include: [
          {
            model: db.Allcode,
            as: "positionData",
            attributes: ["valueEn", "valueVi"],
          },
          {
            model: db.Allcode,
            as: "genderData",
            attributes: ["valueEn", "valueVi"],
          },
        ],
        raw: true,
        nest: true,
      });
      resolve({
        errCode: 0,
        data: users,
      });
    } catch (error) {
      reject(error);
    }
  });
};

let getAllDoctors = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let doctors = await db.User.findAll({
        where: { roleId: "R2" },
        attributes: {
          exclude: ["password", "image"],
        },
      });

      resolve({
        errCode: 0,
        data: doctors,
      });
    } catch (error) {
      reject(error);
    }
  });
};

let checkRequiredFields = (inputData) => {
  let arrFields = [
    "doctorId",
    "contentHTML",
    "contentMarkdown",
    "action",
    "selectedPrice",
    "selectedPayment",
    "selectedProvince",
    "nameClinic",
    "addressClinic",
    "note",
    "specialtyId",
  ];
  let isValid = true;
  let element = "";
  for (let i = 0; i < arrFields.length; i++) {
    if (!inputData[arrFields[i]]) {
      isValid = false;
      element = arrFields[i];
      break;
    }
  }
  return {
    isValid: isValid,
    element: element,
  };
};

let saveDetailInforDoctor = (inputData) => {
  return new Promise(async (resolve, reject) => {
    try {
      let checkObj = checkRequiredFields(inputData);
      if (checkObj.isValid === false) {
        resolve({
          errCode: 1,
          errMessage: `Missing parameter: ${checkObj.element}`,
        });
      } else {
        //upsert to Markdown
        if (inputData.action === "CREATE") {
          await db.Markdown.create({
            contentHTML: inputData.contentHTML,
            contentMarkdown: inputData.contentMarkdown,
            description: inputData.description,
            doctorId: inputData.doctorId,
          });
        } else if (inputData.action === "EDIT") {
          let doctorMarkdown = await db.Markdown.findOne({
            where: { doctorId: inputData.doctorId },
            raw: false,
          });

          if (doctorMarkdown) {
            doctorMarkdown.contentHTML = inputData.contentHTML;
            doctorMarkdown.contentMarkdown = inputData.contentMarkdown;
            doctorMarkdown.description = inputData.description;
            doctorMarkdown.updateAt = new Date();
            await doctorMarkdown.save();
          }
        }

        //upsert to Doctor_infor

        let doctorInfor = await db.Doctor_Infor.findOne({
          where: {
            doctorId: inputData.doctorId,
          },
          raw: false,
        });

        if (doctorInfor) {
          //update
          doctorInfor.doctorId = inputData.doctorId;
          doctorInfor.priceId = inputData.selectedPrice;
          doctorInfor.provinceId = inputData.selectedProvince;
          doctorInfor.paymentId = inputData.selectedPayment;
          doctorInfor.nameClinic = inputData.nameClinic;
          doctorInfor.addressClinic = inputData.addressClinic;
          doctorInfor.note = inputData.note;
          doctorInfor.specialtyId = inputData.specialtyId;
          doctorInfor.clinicId = inputData.clinicId;

          await doctorInfor.save();
        } else {
          //create
          await db.Doctor_Infor.create({
            doctorId: inputData.doctorId,
            priceId: inputData.selectedPrice,
            provinceId: inputData.selectedProvince,
            paymentId: inputData.selectedPayment,
            nameClinic: inputData.nameClinic,
            addressClinic: inputData.addressClinic,
            note: inputData.note,
            specialtyId: inputData.specialtyId,
            clinicId: inputData.clinicId,
          });
        }

        resolve({
          errCode: 0,
          errMessage: "Save infor doctor succeed !",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};
let getDetailDoctorById = (inputId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!inputId) {
        resolve({
          errCode: 1,
          errMessage: "Missing required paramter !",
        });
      } else {
        let data = await db.User.findOne({
          where: {
            id: inputId,
          },
          attributes: {
            exclude: ["password"],
          },
          include: [
            {
              model: db.Markdown,
              attributes: ["description", "contentHTML", "contentMarkdown"],
            },
            {
              model: db.Allcode,
              as: "positionData",
              attributes: ["valueEn", "valueVi"],
            },
            {
              model: db.Doctor_Infor,
              attributes: {
                exclude: ["id", "doctorId"],
              },
              include: [
                {
                  model: db.Allcode,
                  as: "priceTypeData",
                  attributes: ["valueEn", "valueVi"],
                },
                {
                  model: db.Allcode,
                  as: "provinceTypeData",
                  attributes: ["valueEn", "valueVi"],
                },
                {
                  model: db.Allcode,
                  as: "paymentTypeData",
                  attributes: ["valueEn", "valueVi"],
                },
              ],
            },
          ],
          raw: false,
          nest: true,
        });

        // if (data && data.image) {
        //   data.image = new Buffer(data.image, "base64").toString("binary");
        // }

        if (data && data.image) {
          // Convert base64 encoded data to a Buffer
          let imageBuffer = Buffer.from(data.image, "base64");

          // Convert Buffer to a binary string representation
          data.image = imageBuffer.toString("binary");
        }

        if (!data) data = {};
        resolve({
          errCode: 0,
          data: data,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

let bulkCreateSchedule = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.arrSchedule || !data.doctorId || !data.formatedDate) {
        resolve({
          errCode: -1,
          errMessage: "Missing required paramter !",
        });
      } else {
        let schedule = data.arrSchedule;
        if (schedule && schedule.length > 0) {
          schedule = schedule.map((item) => {
            item.maxNumber = MAX_NUMBER_SCHEDULE;
            return item;
          });
        }
        //get all existing data
        let existing = await db.Schedule.findAll({
          where: { doctorId: data.doctorId, date: data.formatedDate },
          attributes: ["timeType", "date", "doctorId", "maxNumber"],
          raw: true,
        });

        //compare different
        let toCreate = _.differenceWith(schedule, existing, (a, b) => {
          return a.timeType === b.timeType && +a.date === +b.date;
        });
        //create data
        if (toCreate && toCreate.length > 0) {
          await db.Schedule.bulkCreate(toCreate);
        }

        resolve({
          errCode: 0,
          errMessage: "OK !",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

let getScheduleByDate = (doctorId, date) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!doctorId || !date) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter !",
        });
      } else {
        let dataSchedule = await db.Schedule.findAll({
          where: {
            doctorId: doctorId,
            date: date,
          },
          include: [
            {
              model: db.Allcode,
              as: "timeTypeData",
              attributes: ["valueEn", "valueVi"],
            },
            {
              model: db.User,
              as: "doctorData",
              attributes: ["firstName", "lastName"],
            },
          ],
          raw: false,
          nest: true,
        });
        if (!dataSchedule) dataSchedule = [];

        resolve({
          errCode: 0,
          data: dataSchedule,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

let getExtraInforDoctorById = (idInput) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!idInput) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter !",
        });
      } else {
        let data = await db.Doctor_Infor.findOne({
          where: {
            doctorId: idInput,
          },
          attributes: {
            exclude: ["id", "doctorId"],
          },
          include: [
            {
              model: db.Allcode,
              as: "priceTypeData",
              attributes: ["valueEn", "valueVi"],
            },
            {
              model: db.Allcode,
              as: "provinceTypeData",
              attributes: ["valueEn", "valueVi"],
            },
            {
              model: db.Allcode,
              as: "paymentTypeData",
              attributes: ["valueEn", "valueVi"],
            },
          ],
          raw: false,
          nest: true,
        });

        if (!data) data = [];
        resolve({
          errCode: 0,
          data: data,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

let getProfileDoctorById = (inputId) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!inputId) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter !",
        });
      } else {
        let data = await db.User.findOne({
          where: {
            id: inputId,
          },
          attributes: {
            exclude: ["password"],
          },
          include: [
            {
              model: db.Markdown,
              attributes: ["description", "contentHTML", "contentMarkdown"],
            },
            {
              model: db.Allcode,
              as: "positionData",
              attributes: ["valueEn", "valueVi"],
            },
            {
              model: db.Doctor_Infor,
              attributes: {
                exclude: ["id", "doctorId"],
              },
              include: [
                {
                  model: db.Allcode,
                  as: "priceTypeData",
                  attributes: ["valueEn", "valueVi"],
                },
                {
                  model: db.Allcode,
                  as: "provinceTypeData",
                  attributes: ["valueEn", "valueVi"],
                },
                {
                  model: db.Allcode,
                  as: "paymentTypeData",
                  attributes: ["valueEn", "valueVi"],
                },
              ],
            },
          ],
          raw: false,
          nest: true,
        });

        if (data && data.image) {
          // Convert base64 encoded data to a Buffer
          let imageBuffer = Buffer.from(data.image, "base64");

          // Convert Buffer to a binary string representation
          data.image = imageBuffer.toString("binary");
        }

        if (!data) data = {};
        resolve({
          errCode: 0,
          data: data,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

let getListPatientForDoctor = (doctorId, date) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!doctorId || !date) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter !",
        });
      } else {
        let data = await db.Booking.findAll({
          where: { statusId: "S2", doctorId: doctorId, date: date },
          include: [
            {
              model: db.User,
              as: "patientData",
              attributes: [
                "email",
                "firstName",
                "address",
                "gender",
                "phonenumber",
              ],
              include: [
                {
                  model: db.Allcode,
                  as: "genderData",
                  attributes: ["valueEn", "valueVi"],
                },
              ],
            },
            {
              model: db.Allcode,
              as: "timeTypeDataPatient",
              attributes: ["valueEn", "valueVi"],
            },
          ],
          raw: false,
          nest: true,
        });
        resolve({
          errCode: 0,
          data: data,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

let sendRemedy = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!data.email || !data.doctorId || !data.patientId || !data.timeType) {
        resolve({
          errCode: 1,
          errMessage: "Missing required parameter !",
        });
      } else {
        // update patient status
        let apppointment = await db.Booking.findOne({
          where: {
            doctorId: data.doctorId,
            patientId: data.patientId,
            timeType: data.timeType,
            statusId: "S2",
          },
          raw: false,
        });
        if (apppointment) {
          apppointment.statusId = "S3";
          await apppointment.save();
        }
        // send email remedy
        await emailService.sendAttachment(data);
        resolve({
          errCode: 0,
          errMessage: "OK !",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

let postMedicalRecords = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        !data.email ||
        !data.medicalFacility ||
        !data.hospital ||
        !data.storageNumber ||
        !data.medicalCode ||
        !data.fullName ||
        !data.birthday ||
        !data.gender ||
        !data.job ||
        !data.ethnicGroup ||
        !data.address ||
        !data.workplace ||
        !data.object ||
        !data.healthInsurancePeriod ||
        !data.cardNumber ||
        !data.phoneNumber ||
        !data.dateAdmission ||
        !data.placeIntroduction ||
        !data.dischargeDate
      ) {
        resolve({
          errCode: 1,
          errMessage: "Missing parameter !",
        });
      } else {
        await db.Medicalrecords.create({
          email: data.email,
          medicalFacility: data.medicalFacility,
          hospital: data.hospital,
          storageNumber: data.storageNumber,
          medicalCode: data.medicalCode,
          fullName: data.fullName,
          birthday: data.birthday,
          job: data.job,
          ethnicGroup: data.ethnicGroup,
          gender: data.gender,
          address: data.address,
          workplace: data.workplace,
          object: data.object,
          healthInsurancePeriod: data.healthInsurancePeriod,
          cardNumber: data.cardNumber,
          phoneNumber: data.phoneNumber,
          dateAdmission: data.dateAdmission,
          placeIntroduction: data.placeIntroduction,
          dischargeDate: data.dischargeDate,
        });
        resolve({
          errCode: 0,
          errMessage: "Successfully save medical records !",
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

let getAllMedicalRecords = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let medicalRecords = await db.Medicalrecords.findAll({
        attributes: { exclude: ["doctorId"] },
        order: [["createdAt", "DESC"]],
      });

      resolve({
        errCode: 0,
        data: medicalRecords,
      });
    } catch (error) {
      reject(error);
    }
  });
};

let getMedicalRecordsByEmail = (inputEmail) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!inputEmail) {
        resolve({
          errCode: 1,
          errMessage: "Missing required paramter !",
        });
      } else {
        let data = await db.Medicalrecords.findOne({
          where: {
            email: inputEmail,
          },

          // raw: false,
          // nest: true,
        });
        if (!data) data = {};
        resolve({
          errCode: 0,
          data: data,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

let deleteMedicalRecords = (MedicalRecordsId) => {
  return new Promise(async (resolve, reject) => {
    let foundMedicalRecords = await db.Medicalrecords.findOne({
      where: { id: MedicalRecordsId },
    });
    if (!foundMedicalRecords) {
      resolve({
        errCode: 2,
        errMessage: `The user isn't exist`,
      });
    }

    await db.Medicalrecords.destroy({
      where: { id: MedicalRecordsId },
    });
    resolve({
      errCode: 0,
      message: `The user is delete`,
    });
  });
};

let editMedicalRecords = (data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        !data.email ||
        !data.medicalFacility ||
        !data.hospital ||
        !data.storageNumber ||
        !data.medicalCode ||
        !data.fullName ||
        !data.birthday ||
        !data.gender ||
        !data.job ||
        !data.ethnicGroup ||
        !data.address ||
        !data.workplace ||
        !data.object ||
        !data.healthInsurancePeriod ||
        !data.cardNumber ||
        !data.phoneNumber ||
        !data.dateAdmission ||
        !data.placeIntroduction ||
        !data.dischargeDate
      ) {
        resolve({
          errCode: 2,
          message: "Missing required parameters !",
        });
      }
      let Medicalrecords = await db.Medicalrecords.findOne({
        where: { id: data.id },
        raw: false,
      });
      if (Medicalrecords) {
        Medicalrecords.email = data.email;
        Medicalrecords.medicalFacility = data.medicalFacility;
        Medicalrecords.hospital = data.hospital;
        Medicalrecords.storageNumber = data.storageNumber;
        Medicalrecords.medicalCode = data.medicalCode;
        Medicalrecords.fullName = data.fullName;
        Medicalrecords.birthday = data.birthday;
        Medicalrecords.gender = data.gender;
        Medicalrecords.job = data.job;
        Medicalrecords.ethnicGroup = data.ethnicGroup;
        Medicalrecords.address = data.address;
        Medicalrecords.workplace = data.workplace;
        Medicalrecords.object = data.object;
        Medicalrecords.healthInsurancePeriod = data.healthInsurancePeriod;
        Medicalrecords.cardNumber = data.cardNumber;
        Medicalrecords.phoneNumber = data.phoneNumber;
        Medicalrecords.dateAdmission = data.dateAdmission;
        Medicalrecords.placeIntroduction = data.placeIntroduction;
        Medicalrecords.dischargeDate = data.dischargeDate;
        await Medicalrecords.save();
        resolve({
          errCode: 0,
          message: "Update the user succeeds !",
        });
      } else {
        resolve({
          errCode: 1,
          errMessage: `User's not Found !`,
        });
      }
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  getTopDoctorHome: getTopDoctorHome,
  getAllDoctors: getAllDoctors,
  saveDetailInforDoctor: saveDetailInforDoctor,
  getDetailDoctorById: getDetailDoctorById,
  bulkCreateSchedule: bulkCreateSchedule,
  getScheduleByDate: getScheduleByDate,
  getExtraInforDoctorById: getExtraInforDoctorById,
  getProfileDoctorById: getProfileDoctorById,
  getListPatientForDoctor: getListPatientForDoctor,
  sendRemedy: sendRemedy,
  postMedicalRecords: postMedicalRecords,
  getAllMedicalRecords: getAllMedicalRecords,
  getMedicalRecordsByEmail: getMedicalRecordsByEmail,
  deleteMedicalRecords: deleteMedicalRecords,
  editMedicalRecords: editMedicalRecords,
};
