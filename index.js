require('dotenv').config();
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(process.env.AIRTABLE_BASE_ID);

async function getFormSubmissions() {
  const records = await base(process.env.AIRTABLE_TABLE_NAME).select({
    view: 'Grid view' // Adjust this based on your Airtable setup
  }).firstPage();

  return records.map(record => ({
    id: record.id,
    fields: record.fields,
  }));
}

getFormSubmissions().then(records => {
  console.log(records);
});

function validateFields(fields) {
    //TODO: update required fields for cert form and list them in the below array
    const requiredFields = ['App Name', 'Developer Name', 'Production Ready'];
  
    let missingFields = [];
  
    requiredFields.forEach(field => {
      if (!fields[field]) {
        missingFields.push(field);
      }
    });
  
    // Example: Check if a field has an acceptable value
    if (fields['Production Ready'] !== 'Yes') {
      missingFields.push('Production Ready must be Yes');
    }
  
    return missingFields;
  }

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendEmail(to, missingFields) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to, // Developer email
    cc: 'integrations@clever.com', // Your team alias
    subject: 'Missing Information in your District SSO/Library Certification',
    text: `Hello, 
            Please provide the following missing information for your app request: ${missingFields.join(', ')}
            
            Best,     
            Clever Partner Engineering`, }

await transporter.sendMail(mailOptions);}

async function processSubmissions() {
    const submissions = await getFormSubmissions();
  
    submissions.forEach(submission => {
      const missingFields = validateFields(submission.fields);
  
      if (missingFields.length > 0) {
        sendEmail(submission.fields['Developer Email'], missingFields)
          .then(() => console.log(`Email sent to ${submission.fields['Developer Email']}`))
          .catch(err => console.error('Error sending email:', err));
      }
    });
  }
  
  processSubmissions();
