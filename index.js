const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const nodemailer = require("nodemailer"); // Import Nodemailer
require("dotenv").config();
const port = process.env.PORT || 8000;
const app = express();

// Middleware>>>>
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wtcs29q.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const contactQueriesCollection = client.db("KyphorantisDB").collection("contactQueries");


    // Nodemailer Transporter Configuration
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Use the appropriate email service
      auth: {
        user: process.env.EMAIL_USER, // Your email address (from .env)
        pass: process.env.EMAIL_PASS  // Your email password or app-specific password (from .env)
      }
    });

    app.post('/contact-request', async (req, res) => {
      const service = req.body;
      // Insert service request into the database
      const result = await contactQueriesCollection.insertOne(service);
      // Email Content Formatting
      const emailContent = `
      <h3>New Service Request From Tech-Vixo</h3>
      <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
        <tr>
          <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f2f2f2;">Field</th>
          <th style="border: 1px solid #dddddd; text-align: left; padding: 8px; background-color: #f2f2f2;">Details</th>
        </tr>
        <tr>
          <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Name</td>
          <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${service?.name}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Email</td>
          <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${service?.email}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Number</td>
          <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${service?.phone}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Organization Name</td>
          <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${service?.organization_name}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Country Name</td>
          <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${service?.country}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">Note</td>
          <td style="border: 1px solid #dddddd; text-align: left; padding: 8px;">${service?.note}</td>
        </tr>
      </table>
    
      <p style="font-family: Arial, sans-serif; color: #555555;">This is an automated email. Please do not reply.</p>
    `;
 
      // Email Options
      const mailOptions = {
        from:`${service?.email}` , // Sender address
        to: process.env.EMAIL_USER, // Replace with the actual recipient's email
        subject: `${service?.organization_name}`,
        html: emailContent
      };

      // Send the email
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          res.status(500).send({ message: 'Failed to send email', error });
        } else {
          console.log('Email sent: ' + info.response);
          res.status(200).send({ message: 'Service request received and email sent successfully', result });
        }
      });
    });


  } finally {
    // You can close the connection here if needed
  }
}

run().catch(console.log);

app.get("/", (req, res) => {
  res.send("Tech Vixo project server is running...");
});

app.listen(port, () => {
  console.log(`Tech Vixo project running on port ${port}`);
});
