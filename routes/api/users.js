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


//for active & friends users
const lookForScore = (element, index) => {
  return Score.findOne({ uid: element.uid })
    .sort({ date: -1 })
    .then(score => {
      return {
        uid: element.uid,
        nickname: element.nickname,
        level: element.level,
        color: element.color,
        lastScore: score
      };
    });
};

const formatArr = arr => {
  return Promise.all(arr.map((element, index) => lookForScore(element, index)));
};


//for top players
const lookForUser2 = (element, index) => {
  return User.findOne({ uid: element.uid }).then(user => {
    return {
      key: index,
      uid: user.uid,
      nickname: user.nickname,
      level: user.level,
      color: user.color,
      lastScore: element
    };
  });
};

const formated2 = scores => {
  return Promise.all(
    scores.map((element, index) => lookForUser2(element, index))
  );
};


// @route GET api/user
// @desc Get top users
// @access Public
router.post('/players', async (req, res) => {
  const { category, id } = req.body;
  if (category === 'Top') {
    const scores = await Score.find({}, err => {
      if (err) res.status(400).send('not found');
    }).sort({ score: 1 });
    formated2(scores).then(data => res.status(202).send(data));
  } else {
    if (category === 'Active') {
      let activeUsers = await User.find()
        .limit(5)
        .sort({ activity: -1 });
      formatArr(activeUsers).then(data => res.status(202).send(data));
    } else if (category === 'Friends') {
      let friendUsers = await User.find({ friends: id })
        .limit(5)
        .sort({ date: -1 });
      formatArr(friendUsers).then(data => res.status(202).send(data));
    }
  }
});


//for notifications
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

// @route GET api/user
// @desc Get friend users
// @access Public
router.post('/notifications', async (req, res) => {
  try {
    let uid = req.body;
    const user = await User.findOne(uid, err => {
      if (err) res.status(400).send('Not Found');
    }).then();
    formated(user.requests).then(data => res.status(202).send(data));
  } catch (err) {
    res.status(400).send(err);
  }
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
    //console.log(token);
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
    await User.updateOne({ email }, { activity: Date.now() }, err =>
      console.log(err)
    );
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

//Profile

router.post('/profile', async (req, res) => {
  const { id } = req.body;
  const profile = await User.findOne({ uid: id }, err => {
    if (err) res.status(400).send(err);
  }).then();
  res.status(202).send(profile);
});

//Friendship System

router.post('/addFriend', async (req, res) => {
  const { myid, friend } = req.body;
  const myfriend = await User.findOne({ uid: friend }, err => {
    if (err) res.status(400).send(err);
  }).then();

  if (myfriend.requests.includes(myid)) {
    res
      .status(400)
      .send({ done: false, text: 'Ya tienes una solicitud pendiente.' });
  } else {
    myfriend.requests.push(myid);
  }

  await User.replaceOne({ uid: friend }, myfriend, err => {
    if (!err) {
      res.status(202).send({ done: true, text: 'Solicitud enviada...' });
    } else {
      res.status(400).send(err);
    }
  });
});

router.post('/acceptFriend', async (req, res) => {
  const { myid, friend } = req.body;
  const me = await User.findOne({ uid: myid }, err => {
    if (err) res.status(400).send(err);
  }).then();
  const myfriend = await User.findOne({ uid: friend }, err => {
    if (err) res.status(400).send(err);
  }).then();

  me.requests = me.requests.filter(request => request !== friend);
  myfriend.friends.push(myid);
  me.friends.push(friend);

  await User.replaceOne({ uid: myid }, me, err => {
    if (err) res.status(400).send(err);
  });
  await User.replaceOne({ uid: friend }, myfriend, err => {
    if (err) res.status(400).send(err);
  });
  res.status(202).send({ done: true, text: 'Amistad aceptada.' });
});

router.post('/declineFriend', async (req, res) => {
  const { myid, friend } = req.body;
  const me = await User.findOne({ uid: myid }, err => {
    if (err) res.status(400).send(err);
  }).then();

  me.requests = me.requests.filter(request => request !== friend);
  await User.replaceOne({ uid: myid }, me, err => {
    if (err) res.status(400).send(err);
  });
  res.status(202).send({ done: true, text: 'Solicitud rechazada.' });
});

router.post('/removeFriend', async (req, res) => {
  const { myid, friend } = req.body;

  const me = await User.findOne({ uid: myid }, err => {
    if (err) res.status(400).send(err);
  }).then();
  const myfriend = await User.findOne({ uid: friend }, err => {
    if (err) res.status(400).send(err);
  }).then();

  me.friends = me.friends.filter(uid => uid !== friend);
  myfriend.friends = myfriend.friends.filter(uid => uid !== myid);

  await User.replaceOne({ uid: myid }, me, err => {
    if (err) res.status(400).send(err);
  });
  await User.replaceOne({ uid: friend }, myfriend, err => {
    if (err) res.status(400).send(err);
  });
  res.status(202).send({ done: true, text: 'Amistad eliminada.' });
});

module.exports = router;
