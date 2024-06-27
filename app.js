const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const nodemailer = require("nodemailer");
require('dotenv').config(); // For loading environment variables

const app = express();

// body parser middleware
app.use(bodyParser.urlencoded({ extended: false })); // this is to handle URL encoded data
app.use(bodyParser.json());
// end parser middleware

// custom middleware to log data access
const log = function (request, response, next) {
    console.log(`${new Date()}: ${request.protocol}://${request.get('host')}${request.originalUrl}`);
    console.log(request.body); // make sure JSON middleware is loaded before this line
    next();
}
app.use(log);
// end custom middleware

// enable static files pointing to the folder "public"
// this can be used to serve the index.html file
app.use(express.static(path.join(__dirname, "public")));

// Test route to verify environment variables
// app.get('/test-env', (req, res) => {
//   res.send(`GMAIL_USER: ${process.env.GMAIL_USER}, GMAIL_PASS: ${process.env.GMAIL_PASS}, RECEIVER_EMAIL: ${process.env.RECEIVER_EMAIL}`);
// });

// HTTP POST
app.post("/", async function (request, response) {
    console.log('Received form data:', request.body);

    const recaptchaResponse = request.body['g-recaptcha-response'];
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    const recaptchaUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

    // Verify reCAPTCHA
    try {
        const fetch = (await import('node-fetch')).default;
        const recaptchaRes = await fetch(recaptchaUrl, { method: 'POST' });
        const recaptchaData = await recaptchaRes.json();

        if (!recaptchaData.success) {
            return response.status(400).json({ message: "reCAPTCHA verification failed. Please try again." });
        }

        // create reusable transporter object using the default SMTP transport
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.GMAIL_USER, // this should be YOUR GMAIL account from environment variable
                pass: process.env.GMAIL_PASS // this should be your password from environment variable
            }
        });

        var textBody = `FROM: ${request.body.name} EMAIL: ${request.body.email} SUBJECT: ${request.body.subject} MESSAGE: ${request.body.message}`;
        var htmlBody = `<h2>Mail From Contact Form</h2><p>from: ${request.body.name} <a href="mailto:${request.body.email}">${request.body.email}</a></p> <p>${request.body.subject}</p>  <p>${request.body.message}</p>`;
        var mail = {
            from: process.env.GMAIL_USER, // sender address
            to: process.env.RECEIVER_EMAIL, // list of receivers (THIS COULD BE A DIFFERENT ADDRESS or ADDRESSES SEPARATED BY COMMAS)
            subject: "Mail From Contact Form", // Subject line
            text: textBody,
            html: htmlBody
        };

        try {
            let info = await transporter.sendMail(mail);
            console.log(`Message sent: ${info.messageId}`);
            response.json({ message: `message sent: ${info.messageId}` });
        } catch (err) {
            console.error('Error occurred while sending email:', err);
            response.status(500).json({ message: "message not sent: an error occurred; check the server's console log" });
        }
    } catch (err) {
        console.error('Error occurred while verifying reCAPTCHA:', err);
        response.status(500).json({ message: "reCAPTCHA verification failed. Please try again." });
    }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});
