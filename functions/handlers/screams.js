/* eslint-disable consistent-return */
const { db } = require('../util/admin');

// Get all screams as a JSON object
exports.getAllScreams = (req, res) => {
  db.collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) =>
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userhandle: doc.data().userHandle,
          createdAt: doc.data().createdAt,
          commentCount: doc.data().commentCount,
          likeCount: doc.data().likeCount,
        }),
      );
      return res.json(screams);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Post a single scream after authentication
exports.postOneScream = (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString(),
  };

  db.collection('screams')
    .add(newScream)
    .then((doc) =>
      res.json({ message: `document ${doc.id} created successfully` }),
    )
    .catch((err) => {
      res.status(500).json({ message: 'something went wrong', error: err });
      console.error(err);
    });
};

//Fetch one scream
exports.getScream = (req, res) => {
  let screamData = {};
  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists) {
        return res.status(404).json({ error: 'Scream not found' });
      }
      screamData = doc.data();
      screamData.screamId = doc.id;
      return db
        .collection('comments')
        .orderBy('createdAt', 'desc')
        .where('screamId', '==', req.params.screamId)
        .get();
    })
    .then((data) => {
      screamData.comments = [];
      data.forEach((doc) => {
        screamData.comments.push(doc.data());
      });
      return res.json(screamData);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: err.code });
    });
};

// Comment on a scream after authentication
exports.commentOnScream = (req, res) => {
  if (req.body.body.trim() === '')
    return res.status(400).json({ error: 'Must not be empty' });

  const newComment = {
    body: req.body.body,
    createdAt: new Date().toISOString(),
    screamId: req.params.screamId,
    userHandle: req.user.handle,
    userImage: req.user.imageURL,
  };

  db.doc(`/screams/${req.params.screamId}`)
    .get()
    .then((doc) => {
      if (!doc.exists)
        return res.status(404).json({ error: 'Scream not found' });
      return db.collection('comments').add(newComment);
    })
    .then(() => res.json(newComment))
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: 'Something went wrong' });
    });
};
