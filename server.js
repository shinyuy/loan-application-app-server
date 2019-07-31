const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
require('dotenv').config(); 
const logger = require("morgan");
//const Data = require("./models/data");
const API_PORT = process.env.PORT || 5000;
const app = express();
const fs = require("fs");
const writeStream = fs.createWriteStream('test.xlsx');
const router = express.Router();
const formidable = require('express-formidable');
const cloudinary = require('cloudinary');
const nodemailer = require('nodemailer');
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);
var cors = require('cors');
app.use(cors());  


//  Models 
const Data = require("./models/data");
const User = require("./models/user");

// Middlewares
const { auth } = require('./middlewares/auth');
const { admin } = require('./middlewares/admin');



// Write Headers
writeStream.write(`Name, Loan Amount, Annual Interest, Repayment Period, Monthly Payment, Total Payment, Total Interest \n`);

// Connect to database
const dbRoute = 'mongodb://microapp:microapp1@ds119606.mlab.com:19606/microapp';
mongoose.connect(
  dbRoute,
  { useNewUrlParser: true }
);
let db = mongoose.connection;
db.once("open", () => console.log("connected to the database"));
// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// (optional) only made for logging and
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(logger("dev"));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});     

// this is our post method method images for uploading images from the front end, and from here they eventually get send and saved in the cloud with cloudinary
router.post('/images/uploadimage', formidable(), (req, res) => {
  cloudinary.uploader.upload(req.files.file.path, (result) => {
    console.log(result);
    res.status(200).send({
      public_id: result.public_id,
      url: result.url
    })
  }, {
      public_id: `${Date.now()}`,
      resource_type: 'auto'
    })
}) 

router.get('/images/removeimage', (req, res) => {
  let image_id = req.query.public_id;

  cloudinary.uploader.destroy(image_id, (error, result) => {
    if (error) return res.json({ success: false, error });
    res.status(200).send('Okay');
  })
})

// this is our get method this method fetches all available data in our database
router.get("/getData", (req, res) => {
  Data.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
}); 

// this is our get method using sortBy, to get just, whoes loan application has been validated, and validated= true 
router.get("/getData/validated", (req, res) => {
  let query = Data.find({}) 

  query.where('validated', true)
    .exec((err, docs) => {
      if (err) return res.status(400).send(err);
      res.status(200).json({
        success: true, docs
      })
    })
});

// this our get method for a single applicant this method fetches a single data object by id from the database.
router.get("/getData/:id", (req, res) => {
  let id = req.params.id;
  Data.findById(id, (err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});  

// this our get method for a single applicant this method fetches a single data object by id from the database.
router.get("/getUserData", (req, res) => {
  let email = req.query.email; 
  console.log(email) 
  Data.find({email: email}, (err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});  

// this is our update method this method overwrites existing data in our database
router.post("/updateData/:id", (req, res) => {
  let id = req.params.id;
  const { name, email, age, location, region, city, street, phoneNumber, amount, colateral, message, validated, images,
    loanAmount, annualInterest, repaymentPeriod, monthlyPayment, totalPayment, totalInterest } = req.body;
  Data.findById(id, (err, data) => {
    if (!data)
      res.status(404).send("data is not found");

    else if (!name || !email || !age || !location || !region || !city || !street || !phoneNumber || !amount || !colateral || !message || !validated || !images)
      return res.json({
        success: false,
        error: "INVALID INPUTS"
      });
    else                    
      data.name = name;
    data.email = email;
    data.age = age;
    data.location = location;
    data.region = region;
    data.city = city;
    data.street = street;
    data.phoneNumber = phoneNumber;
    data.amount = amount;
    data.colateral = colateral;
    data.message = message;
    data.validated = validated;
    data.images = images;
    data.loanAmount = loanAmount;
    data.annualInterest = annualInterest;
    data.repaymentPeriod = repaymentPeriod;
    data.monthlyPayment = monthlyPayment;
    data.totalPayment = totalPayment;
    data.totalInterest = totalInterest;
    data.save(err => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true });
    });
  })
  // async..await is not allowed in global scope, must use a wrapper
  async function main() {

    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    let testAccount = await nodemailer.createTestAccount();

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass // generated ethereal password
      }
    });         
 
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: '"XYZ Credit Union 👻" <shinyuy9@gmail.com>', // sender address
      to: `${email}`, // list of receivers
      subject: "Loan Application Validated ✔", // Subject line
      text: `Hello  ${name} this email is to inform you that your application for a loan at XYZ Credit Union has been validated, and you should come to
    our office at the Commercial Avenue Bamenda with your identification documents, as well as documents proving your ownership of the colateral property you provided on your application (${colateral}.)`, // plain text body
      html: "<b>Credit Union Team</b>" // html body
    });  

    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
  }
  main().catch(console.error);

  client.messages.create({
    to: `+237${phoneNumber}`,
    from: '+12404286306',
    body: `Hello  ${name} this message is to inform you that your application for a loan at XYZ Credit Union has been validated, and you should come to
  our office at the Commercial Avenue Bamenda with your identification documents, as well as documents proving your ownership of the colateral property you provided on your application (${colateral}.)`
  })
  .then(res=> {
    console.log(res.body);
  })
   console.log(loanAmount);  
  // Write Applicant Data on Excel Sheet
  if(loanAmount !== undefined) {
    writeStream.write(`${name}, ${loanAmount}, ${annualInterest}, ${repaymentPeriod}, ${monthlyPayment}, ${totalPayment}, ${totalInterest} \n`);
  }
});

/*
// this is our delete method
// this method removes existing data in our database
router.delete("/deleteData", (req, res) => {
  const { id } = req.body;
  Data.findOneAndDelete(id, err => {
    if (err) return res.send(err);
    return res.json({ success: true });
  });
});
*/

// this is our create method this method adds new data in our database
router.post("/putData", (req, res) => {
  let data = new Data();

  const { name, email, age, location, region, city, street, phoneNumber, amount, colateral, message, validated, images } = req.body;

  if (!name || !age || !location || !region || !city || !street || !phoneNumber || !amount || !colateral || !message || !images) {
    return res.json({
      success: false,
      error: "INVALID INPUTS"
    });
  }
  data.name = name;
  data.email = email;
  data.age = age;
  data.location = location;
  data.region = region;
  data.city = city;
  data.street = street;
  data.phoneNumber = phoneNumber;
  data.amount = amount;
  data.colateral = colateral;
  data.message = message;
  data.validated = validated;
  data.images = images;
  data.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});   

  /***************************************
 //      Users                         //
 **************************************/
 
router.get('/auth', auth, (req, res)=>{
  res.status(200).json({
      isAdmin: req.user.role === 0 ? false : true,
      isAuth: true,
      email: req.user.email,
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      phoneNumber: req.user.phoneNumber,
      role: req.user.role,   
      images: req.user.images,
      accountNumber: req.user.accountNumber,  
      savings: req.user.savings
  }) 
}); 
 
 router.post("/register", (req, res) => {
   const user = new User(req.body);
   user.save((err, doc) => {
     if (err) return res.json({ success: false, err });
     res.status(200).json({
       success: true,
       userData: doc
     });
   });
 }); 

 router.get("/getAdmins", (req, res) => {
  let query = User.find({}) 

  query.where('role', 1)
    .exec((err, docs) => {
      if (err) return res.status(400).send(err);
      res.status(200).json({
        success: true, docs
      })
    })
}); 

router.get("/getUsers", (req, res) => {
  let query = User.find({}) 

  query.where('role', 0)
    .exec((err, docs) => {
      if (err) return res.status(400).send(err);
      res.status(200).json({
        success: true, docs
      })
    })
}); 
  
router.get("/getUsers/:id", (req, res) => {
  let id = req.params.id;
  console.log(id);   
  User.findById(id, (err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});   

 router.post("/login", (req, res) => {
   //Find the email
   User.findOne({ email: req.body.email }, (err, user) => {
     if (!user)
       return res.json({
         loginSuccess: false,
         message: "Auth failed, email not found"
       });
 
     //Grab the password and check
     user.comparePassword(req.body.password, (err, isMatch) => {
       if (!isMatch)
         return res.json({
           loginSuccess: false,
           message: "Wrong Password or Email"
         });

       //Generate a new token
       user.generateToken((err, user) => {
         if (err) return res.status(400).send(err);
         res
           .cookie("w_auth", user.token)
           .status(200)
           .json({ loginSuccess: true });
       });
     });
   });
 });  

 router.post("/setAccountNumber/:id", (req, res) => {
  let id = req.params.id;
  const { firstname, lastname, email, phoneNumber,images, accountNumber } = req.body;
  User.findById(id, (err, user) => {
    if (!user)
      res.status(404).send("user is not found");

    else if (!firstname || !email || !lastname || !phoneNumber || !images || !accountNumber)
      return res.json({
        success: false,
        error: "INVALID INPUTS" 
      });
    else                       
      user.firstname = firstname;
      user.lastname = lastname;
    user.email = email;
    user.phoneNumber = phoneNumber;
    user.images = images;
    user.accountNumber = accountNumber;
    user.save(err => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true });
    });
  })  
 })

 router.post("/save/:id", (req, res) => {
  let id = req.params.id;
  console.log(req.body)
  const { firstname, lastname, email, phoneNumber,images, accountNumber, savings } = req.body;
  User.findById(id, (err, user) => {
    if (!user)
      res.status(404).send("user is not found");

    else if (!firstname || !email || !lastname || !phoneNumber || !images || !accountNumber || !savings)
      return res.json({
        success: false,
        error: "INVALID INPUTS" 
      });  
    else                       
      user.firstname = firstname;
      user.lastname = lastname;
    user.email = email;
    user.phoneNumber = phoneNumber;
    user.images = images;
    user.accountNumber = accountNumber;
    user.savings = savings;
    user.save(err => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true });
    });
  })  
 })

 router.get("/logout", auth, (req, res) => {
   User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, doc) => {
     if (err) return res.json({ success: false, err });
     return res.status(200).send({
       success: true
     });
   });
 });

// append /api for our http requests
app.use("/api", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));