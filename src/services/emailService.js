// require("dotenv").config();
// import nodemailer from "nodemailer";

// let sendSimpleEmail = async (dataSend) => {
//   const transporter = nodemailer.createTransport({
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//       user: process.env.EMAIL_APP,
//       pass: process.env.EMAIL_APP_PASSWORD,
//     },
//   });

//   const info = await transporter.sendMail({
//     from: '"BOOKING DOCTOR  🏥 " <thanhdatreact@gmail.com>',
//     to: dataSend.receiverEmail,
//     subject: "Thông tin đặt lịch khám bệnh ✔",
//     html: getBodyHTMLEmail(dataSend),
//   });
// };

import dotenv from "dotenv";
import nodemailer from "nodemailer";

// Load environment variables
dotenv.config();

const sendSimpleEmail = async (dataSend) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    service: "gmail",
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"BOOKING DOCTOR  🏥 " <${process.env.EMAIL_APP}>`,
      to: dataSend.receiverEmail,
      subject: "Thông tin đặt lịch khám bệnh ✔",
      html: getBodyHTMLEmail(dataSend),
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

let getBodyHTMLEmail = (dataSend) => {
  let result = "";
  if (dataSend.language === "vi") {
    result = `
      <h3>Xin chào ${dataSend.patientName} ! </h3>
      <p>Bạn nhận được email này vì đã đặt lịch khám bệnh online trên BOOKING DOCTOR !</p>
      <p>Thông tin đặt lịch khám bệnh :${dataSend.reson} </p>
      <div><b>Thời gian : ${dataSend.time}</b></div>
      <div><b>Bác sĩ : ${dataSend.doctorName}</b></div>
      <p>Nếu các thông tin trên là đúng, vui lòng click vào đường link bên dưới để xác nhận và hoàn tất thủ tục đặt lịch khám bệnh. </p>
      <div><a href=${dataSend.redirectLink} target = "_blank">Click here</a></div>
      <div>Xin chân thành cảm ơn ạ !</div>
      `;
  }
  if (dataSend.language === "en") {
    result = `
      <h3>Hello, ${dataSend.patientName} ! </h3>
      <p>You received this email because you booked an online appointment on BOOKING DOCTOR!</p>
      <p>Information for booking a medical appointment:</p>
      <div><b>Time : ${dataSend.time}</b></div>
      <div><b>Doctor : ${dataSend.doctorName}</b></div>
      <p>If the above information is correct, please click the link below to confirm and complete the procedure for booking a medical appointment.</p>
      <div><a href=${dataSend.redirectLink} target = "_blank">Click here</a></div>
      <div>Thank you very much !</div>

      `;
  }
  return result;
};

let sendAttachment = async (dataSend) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    service: "gmail",
    auth: {
      user: process.env.EMAIL_APP,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  try {
    const info = await transporter.sendMail({
      from: `"BOOKING DOCTOR  🏥 " <${process.env.EMAIL_APP}>`,
      to: dataSend.email,
      subject: "Kết quả khám bệnh ✔",
      html: getBodyHTMLEmailRemedy(dataSend),
      attachments: [
        {
          filename: `remedy-${dataSend.patientId}-${dataSend.patientName}.png`,
          content: dataSend.imgBase64.split("base64,")[1],
          encoding: "base64",
        },
      ],
    });
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

let getBodyHTMLEmailRemedy = (dataSend) => {
  let result = "";
  if (dataSend.language === "vi") {
    result = `
      <h3>Xin chào  ${dataSend.patientName} ! </h3>
      <p>Bạn nhận được email  vì sử dụng dịch vụ của BOOKING DOCTOR !</p>
      <p>Thông tin kết quả khám bệnh được gữi trong file đính kèm  </p>
      <div>Xin chân thành cảm ơn ạ !</div>
      `;
  }
  if (dataSend.language === "en") {
    result = `
      <h3>Hello, ${dataSend.patientName} ! </h3>
      <p>You received an email for using the services of BOOKING DOCTOR!</p>
      <p>Information about the results of the medical examination submitted in the attached dossier</p>
      <div>Thank you very much !</div>
      `;
  }
  return result;
};

module.exports = { sendSimpleEmail, sendAttachment };
