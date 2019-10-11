const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// User Model
const User = require('../../models/User');

router.post('/test', (req, res) => {
  console.log(req.body);
});

// @route GET api/user
// @desc Get All users
// @access Public
router.get('/', (req, res) => {
  User.find()
    .sort({ date: -1 })
    .then(users => res.send(res.json(users)));
});

// @route GET api/user
// @desc Get active users
// @access Public
router.get('/active', (req, res) => {
  User.find()
    .sort({ date: -1 })
    .then(users => res.send(users));
});

// @route GET api/user
// @desc Get top users
// @access Public
router.get('/top', (req, res) => {
  User.find()
    .sort({ date: -1 })
    .then(users => res.send(users));
});

// @route GET api/user
// @desc Get friend users
// @access Public
router.get('/friends', (req, res) => {
  User.find()
    .sort({ date: -1 })
    .then(users => res.send(users));
});



// @route   POST api/user
// @desc    Register new user
// @access  Public
router.post('/register', (req, res) => {
  const {
    fullname,
    nickname,
    email,
    password,
    country,
    prefix,
    phone,
    birthday
  } = req.body;

  // Simple validation
  if (
    !fullname ||
    !nickname ||
    !email ||
    !password ||
    !country ||
    !prefix ||
    !phone ||
    !birthday
  ) {
    return res.status(400).json({ msg: 'Please enter all fields' });
  }

  // Check for existing user
  User.findOne({ email }).then(user => {
    if (user) return res.status(400).json({ msg: 'User already exists' });

    admin
      .auth()
      .createUser({
        email: email,
        emailVerified: false,
        password: password,
        displayName: nickname,
        photoURL:
          'https://library.kissclipart.com/20180901/krw/kissclipart-user-thumbnail-clipart-user-lorem-ipsum-is-simply-bfcb758bf53bea22.jpg',
        disabled: false
      })
      .then(function(userRecord) {
        // See the UserRecord reference doc for the contents of userRecord.
        console.log(userRecord);
        console.log('Successfully created new user:', userRecord.uid);
        const newUser = new User({
          uid: userRecord.uid,
          fullname,
          nickname,
          email,
          country: country.label,
          prefix,
          phone,
          birthday,
          color: 'blue'
        });
        newUser.save();
      })
      .catch(function(error) {
        console.log('Error creating new user:', error);
        res.status(401).send(error);
      });
  });
});

// @route   POST api/user
// @desc    Register new user
// @access  Public
router.post('/login', async (req, res, next) => {
  const { email } = req.body;
  const token = req.headers.authorization;

  // idToken comes from the client app
  if(token){
    console.log(token)
    admin
    .auth()
    .verifyIdToken(token)
    .then(function(decodedToken) {
      let uid = decodedToken.uid;
      console.log('Logged and verified.');
    })
    .catch(function(error) {
      // Handle error
      console.log(error, 'login');
      res.status(401).send(error);
      next();
    });
  }

  try {
    const user = await User.findOne({ email }).then(user => user);
    //console.log(user);
    res.send({ user: user });
  } catch (err) {
    console.log(err);
  }
});

router.post('/check_login', (req, res) => {
  const { token } = req.body;
  console.log(req.body, 'body');
  // idToken comes from the client app
  if(token) {
    console.log(token)
    admin
      .auth()
      .verifyIdToken(token)
      .then(function(decodedToken) {
        let uid = decodedToken.uid;
        console.log('success')
        res.send({ verified: true });
      })
      .catch(function(error) {
        // Handle error
        console.log(error, 'checkLogin');
        res.status(401).send(error);
        next();
      });
  }
    
    res.status(501).send('tenes que mandar un token');
});

module.exports = router;
