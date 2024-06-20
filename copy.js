const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const nodemailer = require("nodemailer");


const app = express();

// body parser middleware
app.use(bodyParser.urlencoded( { extended: false } )); // this is to handle URL encoded data
app.use(bodyParser.json());
// end parser middleware


// custom middleware to log data access
const log = function (request, response, next) {
	console.log(`${new Date()}: ${request.protocol}://${request.get('host')}${request.originalUrl}`);
	console.log(request.body); // make sure JSON middleware is loaded before this line
	next();}
app.use(log);
// end custom middleware

// enable static files pointing to the folder "public"
// this can be used to serve the index.html file
app.use(express.static(path.join(__dirname, "public")));



// HTTP POST
app.post("/", function(request, response) {
    // create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
              user: "kaytechit21@gmail.com", // this should be YOUR GMAIL account
              pass: "murkyboot7000" // this should be your password
          }
      });
      
      var textBody = `FROM: ${request.body.name} EMAIL: ${request.body.email} SUBJECT: ${request.body.subject} MESSAGE: ${request.body.message}`;
      var htmlBody = `<h2>Mail From Contact Form</h2><p>from: ${request.body.name} <a href="mailto:${request.body.email}">${request.body.email}</a></p> <p>${request.body.subject}</p>  <p>${request.body.message}</p>`;
      var mail = {
          from: "kaytechit21@gmail.com", // sender address
          to: "kaytechit21@gmail.com", // list of receivers (THIS COULD BE A DIFFERENT ADDRESS or ADDRESSES SEPARATED BY COMMAS)
          subject: "Mail From Contact Form", // Subject line
          text: textBody,
          html: htmlBody
      };  
// send mail with defined transport object
transporter.sendMail(mail, function (err, info) {
    if(err) {
        console.log(err);
        response.json({ message: "message not sent: an error occurred; check the server's console log" });
    }
    else {
        response.json({ message: `message sent: ${info.messageId}` });
        response.send("OK");
    }
});
});


const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log(`Server is running at port ${PORT}`);
}); 