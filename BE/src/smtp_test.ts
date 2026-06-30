
import path from "node:path";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

async function main() {
  console.log({
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
});
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.verify();

  console.log("SMTP connection verified");

  const result = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: "kulshresthaprankush@gmail.com",
    subject: "Bill Gates",
    text: "SMTP Bill is 1000 rs.",
    html: "<h1>SMTP Bill is 1000 rs.</h1>",
  });

  console.log("Message sent");
  console.log(result);
}

main().catch((error) => {
  console.error("SMTP test failed:");
  console.error(error);
});