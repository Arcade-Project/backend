const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Score Model
const Score = require('../../models/Score');

router.post('/test', (req, res) => {
  console.log(req.body);
});

// @route GET api/score
// @desc Get All scores by date
// @access Public
router.get('/recent_score', (req, res) => {
  Score.find()
    .sort({ date: -1 })
    .then(scores => res.send(res.json(scores)));
});

// @route GET api/score
// @desc Get All scores by highest
// @access Public
router.get('/high_score', (req, res) => {
  Score.find()
    .sort({ score: 1 })
    .then(scores => res.send(res.json(scores)));
});

// @route GET api/score
// @desc Get All scores from one game in ascendent order
// @access Public
router.get('/from_game', (req, res) => {
  const { game } = req.body;
  Score.findOne({ game })
    .sort({ score: 1 })
    .then(scores => res.send(res.json(scores)));
});

// @route GET api/score
// @desc Get All scores from one user in ascendent order
// @access Public
router.get('/from_user', (req, res) => {
  const { uid } = req.body;
  Score.findOne({ uid })
    .sort({ score: 1 })
    .then(scores => res.send(res.json(scores)));
});

// @route   POST api/score
// @desc    Register new score
// @access  Public
router.post('/save', (req, res) => {
  const { uid, game, score } = req.body;

  // Simple validation
  if (!uid || !game || !score) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  const newScore = new Score({
    uid,
    game,
    score
  });

  // Check for existing user
  Score.findOne({ uid, game }).then(sameidandgame => {
    console.log(sameidandgame);
    if (sameidandgame) {
      if (score > sameidandgame.score) {
        newScore.save();
      }
      return res.status(400).json({ msg: 'User already have an higher score' });
    } else {
      newScore.save();
    }
  });
});

module.exports = router;
