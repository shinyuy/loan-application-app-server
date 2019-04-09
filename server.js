const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require('dotenv').config();
const logger = require("morgan");
const Data = require("./data");
const API_PORT = process.env.PORT || 5000;
const app = express();
const router = express.Router();
const formidable = require('express-formidable');
const cloudinary = require('cloudinary');



var cors = require('cors');
app.use(cors());

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
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger("dev"));


cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
  });

// this is our post method method images for uploading images from 
// the front end, and from here they eventually get send and saved in the cloud with cloudinary
  router.post('/images/uploadimage',formidable(),(req,res)=>{
    cloudinary.uploader.upload(req.files.file.path,(result)=>{
        console.log(result);
        res.status(200).send({
            public_id: result.public_id,
            url: result.url
        })
    },{
        public_id: `${Date.now()}`,
        resource_type: 'auto'
    })
})


router.get('/images/removeimage', (req, res)=>{
  let image_id = req.query.public_id;

  cloudinary.uploader.destroy(image_id, (error, result)=>{
    if(error) return res.json({success: false, error});
    res.status(200).send('Okay');
  })
})


// this is our get method
// this method fetches all available data in our database
router.get("/getData", (req, res) => {
  Data.find((err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});


// this is our get method using sortBy, to get just,
// whoes loan application has been validated, and validated= true 
router.get("/getData/validated", (req, res) => {
    let query = Data.find({})
  
    query.where('validated', false)
    .exec((err, docs)=>{
      if(err) return res.status(400).send(err);
      res.status(200).json({
        success: true, docs
      })
    })
    
});


// this our get method for a single applicant
// this method fetches a single data object by id from the database.
router.get("/getData/:id", (req, res) => {
  let id = req.params.id;
  Data.findById(id, (err, data) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, data: data });
  });
});
    

// this is our update method
// this method overwrites existing data in our database
router.post("/updateData/:id", (req, res) => {
  let id = req.params.id;
  const { name, email, age, location, region, city, street, phoneNumber, amount, colateral, message, validated, images } = req.body;
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
    data.save(err => {
      if (err) return res.json({ success: false, error: err });
      return res.json({ success: true });
    });
  })
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


// this is our create method
// this method adds new data in our database
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


// append /api for our http requests
app.use("/api", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));