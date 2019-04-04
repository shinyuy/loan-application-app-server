const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// this will be our data base's data structure 
const DataSchema = new Schema(
  {
    id: {
      type: Number,

    },
    name: {
      required: true,
      type: String,
      unique: 0,
      maxlength: 100
    },
    email: {
      required: false,
      type: String,
      unique: 1
    },
    age: {
      required: true,
      type: Number
    },
    location: {
      required: true,
      type: String,
      maxlength: 100
    },
    region: {
      required: true,
      type: Array
    },
    city: {
      required: true,
      type: String
    },
    street: {
      required: true,
      type: String
    },
    phoneNumber: {
      required: true,
      type: Number,
      unique: 1
    },
    amount: {
      required: true,
      type: Number
    },
    colateral: {
      required: true,
      type: String
    },
    message: {
      required: true,
      type: String
    },
    validated: {
      type: Boolean,
      default: false
    },
    document: {
      type: Array,
      default: []
    }
  },
  { timestamps: true }
);

// export the new Schema so we could modify it using Node.js
module.exports = mongoose.model("Data", DataSchema);