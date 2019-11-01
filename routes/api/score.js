const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Score Model
const Score = require('../../models/Score');
// User Model
const User = require('../../models/User');

router.post('/test', (req, res) => {
  console.log(req.body);
});

// @route GET api/score
// @desc Get All scores by date
// @access Public
router.get('/recent', (req, res) => {
  Score.find()
    .sort({ date: -1 })
    .then(scores => res.send(res.json(scores)));
});

// @route GET api/score
// @desc GET All scores by highest in table format
// @access Public

const lookForUser = (element, index) => {
  return User.findOne({ uid: element.uid }).then(user => {
    return {
      key: index,
      name: user.nickname,
      score: element.score,
      uid: element.uid,
      date: element.date,
      game: element.game
    };
  });
};

const formated = scores => {
  return Promise.all(
    scores.map((element, index) => lookForUser(element, index))
  );
};

router.get('/high', async (req, res) => {
  try {
    const scores = await Score.find({}, err => {
      if (err) res.status(400).send('not found');
    })
      .sort({ score: 1 })
      .then();

    formated(scores).then(data => res.status(202).send(data));
  } catch (err) {
    console.log(err);
  }
});

const asyncFunction = (element, index) => {
  return User.findOne({ uid: element.uid }).then(user => {
    return {
      key: index,
      name: user.nickname,
      score: element.score,
      uid: element.uid,
      date: element.date
    };
  });
};

const formatResults = arr => {
  return Promise.all(
    arr.map((element, index) => asyncFunction(element, index))
  );
};

// @route POST api/score
// @desc POST send scores by game in table format
// @access Public
router.post('/from_game', async (req, res) => {
  try {
    let game = req.body.game;
    let scorelist = await Score.find({ game }, err => {
      if (err) res.status(400).send('not found');
    })
      .sort({ score: 1 })
      .then();
    formatResults(scorelist).then(data => res.status(202).send(data));
  } catch (err) {
    res.status(400).send(err);
  }
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
