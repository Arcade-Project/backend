const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv').config();

const users = require('./routes/api/users');
const api = require('./routes/api/');
const score = require('./routes/api/score');

const app = express();
const port = process.env.PORT || 5000;

const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key:
  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g,'\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url:
  process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  }),
});



async function verifyToken(req, res ,next) {
  const idToken = req.headers.authorization;
  console.log('verifing token...')
  try{
      const decodedToken = await admin.auth().verifyIdToken(idToken)
      if (decodedToken){
          req.body.uid = decodedToken.uid
          console.log(decodedToken)
      return next();
      }else{
          return res.status(401).send('You are not authorized!')
      }
  } catch( e ){
      return res.status(401).send('You are not authorized!')
  }
}

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
  })
  .catch(err => console.log(err));

app.use(express.json());
//app.use(verifyToken);
app.use('/api', api);
app.use('/user', users);
app.use('/score', score);



// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  //set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

app.listen(port, () => console.log(`Server started on port ${port}`));
