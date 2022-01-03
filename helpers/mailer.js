require('dotenv').config();
const nodemailer = require('nodemailer');
const { verificationEmailTemplate } = require('../helpers/email-template');

async function sendEmail(email, code) {
	try {
		const senderAddress = '"o3capital Bangalore,India👻" <noreplay@o3capital.com>';
		const subject = 'Verify your email';

		// Create the SMTP transport.
		let transporter = nodemailer.createTransport({
			host: process.env.NODEMAILER_SMTP_ENDPOINT,
			port: process.env.NODEMAILER_SMTP_PORT,
			secure: false, // true for 465, false for other ports
			auth: {
				user: process.env.NODEMAILER_EMAIL_USERNAME,
				pass: process.env.NODEMAILER_EMAIL_PASSWORD
			}
		});
		const base64Payload = `${email},${code}`;
		const base64Data = Buffer.from(base64Payload).toString('base64');
		console.log('base64data', base64Data);
		// Specify the fields in the email.
		let mailOptions = {
			from: senderAddress,
			to: email,
			subject: subject,
			html: verificationEmailTemplate(code, base64Data)
		};

		let info = await transporter.sendMail(mailOptions);
		console.log('info ==========>', info);
		return { error: false };
	} catch (error) {
		console.error('send-email-error', error);
		return {
			error: true,
			message: 'Cannot send email'
		};
	}
}

module.exports = { sendEmail };
