const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create Schema

const UserSchema = new Schema({
  uid: {
    type: String,
    required: true
  },
  fullname: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  country: {
    type: String,
    required: true
  },
  prefix: {
    type: String
  },
  phone: {
    type: String
  },
  birthday: {
    type: Date,
    default: Date.now
  },
  register_date: {
    type: Date,
    default: Date.now
  },
  level: {
    type: Number,
    default: 1
  },
  experience: {
    type: Number,
    default: 0
  },
  games: {
    type: Array,
    default: []
  }
});

module.exports = User = mongoose.model('user', UserSchema);
