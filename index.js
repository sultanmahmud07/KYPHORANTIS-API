const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");
require("dotenv").config();

const port = process.env.PORT || 8000;
const app = express();

// Middleware
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
    // Connect the client to the server
    await client.connect();

    const contactQueriesCollection = client.db("KyphorantisDB").collection("contactQueries");

    // Nodemailer Transporter Configuration
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // POST Endpoint for Contact Request
    app.post('/contact-request', async (req, res) => {
      try {
        const data = req.body;

        // 1. Insert service request into the database
        const result = await contactQueriesCollection.insertOne(data);

        // 2. Email Content Formatting (Modern Design)
        // Note: Using variables that match your Frontend Data exactly
        const emailContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background-color: #73AF6F; color: #ffffff; padding: 24px; text-align: center; }
            .header h2 { margin: 0; font-size: 24px; font-weight: 600; }
            .content { padding: 30px; }
            .field-row { border-bottom: 1px solid #eeeeee; padding: 12px 0; display: flex; }
            .field-label { width: 140px; font-weight: bold; color: #555555; flex-shrink: 0; }
            .field-value { color: #333333; line-height: 1.5; }
            .footer { background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #888888; }
            .highlight { color: #73AF6F; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Service Request</h2>
            </div>
            <div class="content">
              <p style="margin-bottom: 20px; color: #666;">You have received a new inquiry via the <strong>Kyphorantis</strong> website.</p>
              
              <div class="field-row">
                <div class="field-label">Subject</div>
                <div class="field-value highlight">${data?.subject || 'General Inquiry'}</div>
              </div>

              <div class="field-row">
                <div class="field-label">Name</div>
                <div class="field-value">${data?.name}</div>
              </div>

              <div class="field-row">
                <div class="field-label">Email</div>
                <div class="field-value"><a href="mailto:${data?.email}" style="color: #73AF6F; text-decoration: none;">${data?.email}</a></div>
              </div>

              <div class="field-row">
                <div class="field-label">Phone</div>
                <div class="field-value">${data?.phone}</div>
              </div>

              <div class="field-row">
                <div class="field-label">Service Type</div>
                <div class="field-value">${data?.enquery}</div>
              </div>

              <div class="field-row" style="border-bottom: none;">
                <div class="field-label">Note</div>
                <div class="field-value">${data?.editionalInfo || 'N/A'}</div>
              </div>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Kyphorantis Server Automation.</p>
            </div>
          </div>
        </body>
        </html>
        `;

        // 3. Email Options
        const mailOptions = {
          from: process.env.EMAIL_USER, // SENDER: Must be your authenticated email
          to: process.env.EMAIL_USER,   // RECEIVER: You
          replyTo: data?.email,         // REPLY-TO: The client's email
          subject: `Kyphorantis Inquiry: ${data?.subject || 'New Message'}`,
          html: emailContent
        };

        // 4. Send the email
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Email Error:", error);
            // We return 200 if DB saved, but include email error info
            res.status(200).send({ message: 'Saved to DB, but email failed', result, emailError: true });
          } else {
            console.log('Email sent: ' + info.response);
            res.status(200).send({ message: 'Service request received and email sent successfully', result });
          }
        });

      } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Internal Server Error", error: err });
      }
    });
    // GET Endpoint: Retrieve all contact requests
    app.get('/contact-requests', async (req, res) => {
      try {
        const query = {};
        // Find all documents in the collection and convert to an array
        const result = await contactQueriesCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send({ message: "Failed to fetch data", error });
      }
    });
    console.log("Database Connected Successfully");

  } catch (error) {
    console.error("Database Connection Failed", error);
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Kyphorantis project server is running...");
});

app.listen(port, () => {
  console.log(`Kyphorantis project running on port ${port}`);
});