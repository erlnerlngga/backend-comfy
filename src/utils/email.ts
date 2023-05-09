import nodemailer from "nodemailer";
import Mailgen from "mailgen";

const sendEmail = async (options: {
  email: string;
  subject: string;
  message: string;
  name: string;
  resetURL: string;
}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: `${process.env.EMAIL}`,
      pass: `${process.env.EMAIL_PASSWORD}`,
    },
  });

  let mailGenerator = new Mailgen({
    theme: "default",
    product: {
      name: "Mailgen",
      link: "https://mailgen.js",
    },
  });

  let mail = {
    body: {
      name: options.name,
      intro: "Request for reset password.",
      action: {
        instructions: options.message,
        button: {
          color: "#DF2E38",
          text: options.message,
          link: options.resetURL,
        },
      },
      outro: "Thank You.",
    },
  };

  let emailBody = mailGenerator.generate(mail);

  const mailOptions = {
    from: `${process.env.EMAIL}`,
    to: options.email,
    subject: options.subject,
    html: emailBody,
  };

  await transporter.sendMail(mailOptions);
};

export default sendEmail;
