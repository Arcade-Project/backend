const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//create Schema

const ScoreSchema = new Schema({
  uid: {
    type: String,
    required: true
  },
  game: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now(),
  },
  score: {
    type: Number,
    required: true
  },
});

module.exports = Score = mongoose.model('score', ScoreSchema);
