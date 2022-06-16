const { find } = require("lodash");
const { Db } = require("mongodb");

module.exports = function (app, passport, db, ObjectId, path, util, uuidV4) {

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function (req, res) {
    console.log(req.isAuthenticated())
    let login
    if (req.isAuthenticated()) {
      login = true
    }
    else {
      login = false
    }
    res.render('index.ejs', {
      login,
      user: { local: { creator: false } }
    });
  });

  app.get('/home', function (req, res) {
    let login
    if (req.isAuthenticated()) {
      login = true
    }
    else {
      login = false
    }
    res.render('index.ejs', {
      login,
      user: req.user
    });
  });
  // PROFILE SECTION =========================
  app.get('/profile', function (req, res) {
    const DbQuery = creator ?{userid:req.user} : {tags: 'heat'}
    db.collection('songs').find(DbQuery).toArray((err, result) => {
      if (err) return console.log(err)
      res.render('profile.ejs', {
        user: req.user,
        songs: result,
        login: true
      })
    })
  });
//display playlist
// 1. fetch songs from mongo where mood appears in the tag values 
// get 

app.get('/playlist', function (req, res){
  db.collection('songs').find({ tags: "heat" }).toArray((err, result) => {
    if (err) return console.log(err)
    res.render('profile.ejs', {
      user: req.user,
      playlist: result,
      login: true
    })
  })
});
  



  // LOGOUT ==============================
  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  // message board routes ===============================================================

  app.post('/messages', (req, res) => {
    db.collection('messages').insertOne({ name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown: 0 }, (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/profile')
    })
  })



  app.post('/songUpload', amILoggedIn, async (req,res) => {
    console.log(req.body)
    var songPath = uuidV4()
    try{
      const {albumArt} = req.files;
      const fileName = albumArt.name;
      const extension = path.extname(fileName);
      const URL = "/albumArt/" + songPath + extension;

      await util.promisify(albumArt.mv)('./public' + URL );

      res.redirect('/home')
      } catch(err){
        console.log(err);
        res.status(500).json({
          message: err,
        })
        res.end()
      }
        db.collection('songs').save(
          {
                user_id: ObjectId(req.user._id),
                songName: req.body.songName,
                tags: req.body.tags.split(','),
                img: "/albumArt/" + songPath + path.extname(req.files.albumArt.name),
                downloadLink: req.body.downloadLink
          }, {
          upsert: true,
        }, 
            (err, result) => {
              if (err) return console.log(err)
              console.log('saved to database')
            })
        db.collection('users').findOneAndUpdate(
          {
            _id: ObjectId(req.user._id)
        },{
          $push: {
              songs: [req.body.songName, req.body.tags, "/albumArt/" + songPath + path.extname(req.files.albumArt.name), req.body.downloadLink]
          }
        },{
          upsert: false
        },
        (err, result) => {
          if (err) return console.log(err)
          console.log('saved to database')
        })
     })


  // app.post('/songUpload', amILoggedIn, async (req, res) => {
  //   try {
  //     const { albumArt } = req.files;
  //     console.log(albumArt)
  //     const fileName = albumArt.name;
  //     const size = albumArt.data.length;
  //     const extension = path.extname(fileName);
  //     console.log(req.user)


  //     const md5 = albumArt.md5;
  //     const URL = "/img/" + md5 + size + extension;

  //     await util.promisify(albumArt.mv)('./public' + URL);

  //     res.redirect('/profile')
  //   } catch (err) {
  //     console.log(err);
  //     res.status(500).json({
  //       message: err,
  //     })
  //   }
  //   db.collection('songs').save(
  //     {
  //       user_id: ObjectId(req.user._id),
  //       songName: req.body.songName,
  //       tags: req.body.tag,
  //       img: "/img/" + req.files.albumArt.md5 + req.files.albumArt.size + path.extname(req.files.albumArt.name),
  //       downloadLink: req.body.downloadLink,

  //     }, {
  //     upsert: true,
  //   },
  //     (err, result) => {
  //       if (err) return console.log(err)
  //       console.log('saved to database')
  //     })
  // })

  app.delete('/messages', (req, res) => {
    db.collection('messages').findOneAndDelete({ name: req.body.name, msg: req.body.msg }, (err, result) => {
      if (err) return res.send(500, err)
      res.send('Message deleted!')
    })
  })

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage'), login: isLoggedIn });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/home', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function (req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/home', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // =============================================================================
  // UNLINK ACCOUNTS =============================================================
  // =============================================================================
  // used to unlink accounts. for social accounts, just remove the token
  // for local account, remove email and password
  // user account will stay active in case they want to reconnect in the future

  // local -----------------------------------
  app.get('/unlink/local', isLoggedIn, function (req, res) {
    var user = req.user;
    user.local.email = undefined;
    user.local.password = undefined;
    user.save(function (err) {
      res.redirect('/profile');
    });
  });

};
// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (!req) {
    return false
  } else {
    return true
  }
}
function amILoggedIn(req, res, next) {
  if (req.isAuthenticated())
      return next();

  res.redirect('/');
}

