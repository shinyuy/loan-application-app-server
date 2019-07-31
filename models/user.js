const mongoose = require("mongoose");
const bcryt = require("bcrypt");
const jwt = require("jsonwebtoken");
const SALT_I = 10;
require("dotenv").config();

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    unique: 1
  },
  password: {
    type: String,
    required: true,
    minLength: 5
  },
  firstname: {
    type: String,
    required: true,
    maxLength: 50
  },
  lastname: {
    type: String,
    required: true,
    maxLength: 50
  },
  phoneNumber: {
    type: Number,
    required: true,
    maxLength: 10,
    unique: 1
  },
  accountNumber: {
    type: Number,
    default: null
  },
  role: {
    type: Number,
    default: 0
  },
  images: {
    type: Array,
    required: true,
    default: []
  },
  savings:  [ {
    date: Date,
    amount: Number
  }
  ],
  token: {
    type: String
  }
});

userSchema.pre("save", function(next) {
  var user = this;

  if (user.isModified("password")) {
    bcryt.genSalt(SALT_I, function(err, salt) {
      if (err) return next(err);

      bcryt.hash(user.password, salt, function(err, hash) {
        if (err) return next(err);
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcryt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

userSchema.methods.generateToken = function(cb) {
  var user = this;
  var token = jwt.sign(user._id.toHexString(), process.env.SECRET);

  user.token = token;
  user.save(function(err, user) {
    if (err) return cb(err);
    cb(null, user);
  });
};

userSchema.statics.findByToken = function(token, cb) {
  var user = this;

  jwt.verify(token, process.env.SECRET, function(err, decode) {
    user.findOne({ _id: decode, token: token }, function(err, user) {
      if (err) return cb(err);
      cb(null, user);
    });
  });
};

module.exports = mongoose.model("User", userSchema);
