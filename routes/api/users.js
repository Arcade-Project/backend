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
// @desc Get user by id
// @access Public
router.get('/id', (req, res) => {
  User.findOne(req.body.id)
    .sort({ date: -1 })
    .then(users => res.send(users));
});

// @route GET api/user
// @desc Get active users
// @access Public
router.get('/active', (req, res) => {
  User.find()
    .limit(5)
    .sort({ date: -1 })
    .then(users => res.send(users));
});

// @route GET api/user
// @desc Get top users
// @access Public
router.get('/top', (req, res) => {
  User.find()
    .limit(5)
    .sort({ date: -1 })
    .then(users => res.send(users));
});

// @route GET api/user
// @desc Get friend users
// @access Public
router.get('/friends', (req, res) => {
  User.find()
    .limit(5)
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
  if (token) {
    console.log(token);
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
  if (token) {
    console.log(token);
    admin
      .auth()
      .verifyIdToken(token)
      .then(function(decodedToken) {
        let uid = decodedToken.uid;
        console.log('success');
        res.send({ verified: true });
      })
      .catch(function(error) {
        // Handle error
        console.log(error, 'checkLogin');
        res.status(401).send(error);
        next();
      });
  } else {
    res.status(501).send('tenes que mandar un token');
  }
});

//Friendship System

router.post('/addFriend', async (req, res) => {
  const { myid, friend } = req.body;
  const myfriend = await User.findOne({ uid: friend }, err => {if(err) res.status(400).send(err)}).then();
  //User.findOneAndUpdate({uid: friend}, {$push: {requests: myid}}, res.status(202).send('Solicitud enviada...'));
  myfriend.requests.push(myid);
  await User.replaceOne({ uid: friend }, myfriend, err => {
    if (!err) {
      res.status(202).send('Solicitud enviada...');
    } else {
      res.status(400).send(err);
    }
  });
});

router.post('/acceptFriend', async (req, res) => {
  const { myid, friend } = req.body;
  const me = await User.findOne({ uid: myid }, err => {if(err) res.status(400).send(err)}).then();
  const myfriend = await User.findOne({ uid: friend }, err => {if(err) res.status(400).send(err)}).then();

  //User.findOneAndUpdate({uid: myid}, {requests: {$elemMatch: {uid: friend}}}, res.status(202).send('Eliminado de requests'));
  me.requests = me.requests.filter(req => req !== friend);
  //User.findOneAndUpdate({uid: friend}, {$push: {friends: myid}}, res.status(202).send('Amigo agregado 1'));
  myfriend.friends.push(myid);
  //User.findOneAndUpdate({uid: myid}, {$push: {friends: friend}}, res.status(202).send('Amigo agregado 2'));
  me.friends.push(friend);

  await User.replaceOne({ uid: myid }, me, err => {if(err) res.status(400).send(err)});
  await User.replaceOne({ uid: friend }, myfriend, err => {if(err) res.status(400).send(err)});
  res.status(202).send('Amistad aceptada.');
});

router.post('/declineFriend', async (req, res) => {
  const { myid, friend } = req.body;
  const me = await User.findOne({ uid: myid }, err => {if(err) res.status(400).send(err)}).then();
  //User.findOneAndUpdate({uid: myid}, {request: friends.filter(uid => uid !== friend)}, res.status(202).send('Eliminado de requests'));
  me.requests = me.requests.filter(req => req !== friend);
  await User.replaceOne({ uid: myid }, me, err => {if(err) res.status(400).send(err)});
  res.status(202).send('Solicitud rechazada.');
});

router.post('/removeFriend', async (req, res) => {
  const { myid, friend } = req.body;

  const me = await User.findOne({ uid: myid }, err => {if(err) res.status(400).send(err)}).then();
  const myfriend = await User.findOne({ uid: friend }, err => {if(err) res.status(400).send(err)}).then();

  //User.findOneAndUpdate({uid: myid}, {friends: friends.filter(uid => uid !== friend)}, res.status(202).send('Eliminado de tus amigos'));
  me.friends = me.friends.filter(uid => uid !== friend);
  //User.findOneAndUpdate({uid: friend}, {friends: friends.filter(uid => uid !== myid)}, res.status(202).send('Eliminado de sus amigos'));
  myfriend.friends = myfriend.friends.filter(uid => uid !== myid);

  await User.replaceOne({ uid: myid }, me, err => {if(err) res.status(400).send(err)});
  await User.replaceOne({ uid: friend }, myfriend, err => {if(err) res.status(400).send(err)});
  res.status(202).send('Amistad eliminada.');
});

module.exports = router;
