const { Db } = require("mongodb");

module.exports = function (app, passport, db, ObjectId, path, util, uuidV4) {

  // normal routes ===============================================================

  // show the home page (will also have our login links)
  app.get('/home', function (req, res) {
    let login
    if (req.isAuthenticated()) {
      login = true
    }
    else {
      login = false
    }
    db.collection('users').find().toArray((err, result) => {
      if (err) return console.log(err)
      db.collection('songs').find().toArray((err, songList) => {
        if (err) return console.log(err)
    res.render('index.ejs', {
      login,
      user: { local: { creator: true } },
      artists: result,
      songs: songList
    });
  })
  })
});

  // app.get('/home', function (req, res) {
  //   let login
  //   if (req.isAuthenticated()) {
  //     login = true
  //   }
  //   else {
  //     login = false
  //   }
  //   res.render('index.ejs', {
  //     login,
  //     user: req.user
  //   });
  // });
  // PROFILE SECTION =========================
  
  //  stuff w JT
  // app.get('/profile', function (req, res) {
  //   db.collection('songs').find(ObjectId(req.user._id)).toArray((err, results) => {
  //     if (err) return console.log(err)
  //     console.log(`ID=${req.user.songs[i]}`)
  //   })
  //   res.render('profile.ejs', {
  //     user: req.user,
  //     songs: results,
  //     login: true
  //   })
  // });
  app.get('/profile', function (req, res) 
  //jt approach, pass user selected mood via query params and use MongoDB query to select songs whos tags match the mood query parameter//
  // if no mood parameter is specified, display all songs//
  {
    db.collection('songs').find().toArray((err, result) => {
      if (err) return console.log(err)
      if( req.user.local.creator){
      res.render('profile.ejs', {
        artist: '',
        user: req.user,
        songs: result,
        login: true
      })
    }
      else{
        res.render('profileJosh.ejs', {
          artist: '',
          user: req.user,
          songs: result,
          login: true
        })
      }
    })
  });
// example of selecting songs that match a mood//
  function filter(mood){
    db.collection('songs').find({'tags': mood }).toArray((err,result)=>{
    if (err) return console.log(err)
    res.render('profile.ejs')
    })
  }
//display playlist
// 1. fetch songs from mongo where mood appears in the tag values 
// get 
app.get('/artist/:id', function(req, res) {
  const userId = ObjectId(req.params.id)
  db.collection('songs').find({user_id: ObjectId(userId)}).toArray((err, result) => {
    if (err) return console.log(err)
    console.log('line 94', req.user)
    db.collection('users').find({_id: ObjectId(userId)}).toArray((err, userResult) => {
      if (err) return console.log(err)  
    res.render('profile.ejs', {
      user: req.user,
      songs: result,
      artist: userResult[0]
    })
  })
})
});

//
// app.get('/playlist', function (req, res){
//   db.collection('songs').find({ tags: "heat" }).toArray((err, result) => {
//     if (err) return console.log(err)
//     res.render('profile.ejs', {
//       user: req.user,
//       playlist: result,
//       login: true
//     })
//   })

// });
  
// Potentially differ between consumers or creators in terms of viewing music
  // app.get('/profile', function (req, res) {
  //   const DbQuery = creator ? {userid:req.user} : {tags: 'heat'}
  //   db.collection('songs').find(DbQuery).toArray((err, result) => {
  //     if (err) return console.log(err)
  //     res.render('profile.ejs', {
  //       user: req.user,
  //       songs: result,
  //       login: true
  //     })
  //   })
  // });

  app.get('/releases', function (req, res) {
    db.collection('songs').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.render('releases.ejs', {
        user: req.user,
        songs: result,
        login: true
      })
    })
  });
  app.get('/artists', function (req, res) {
    db.collection('songs').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.render('artists.ejs', {
        user: req.user,
        songs: result,
        login: true
      })
    })
  });
  app.get('/news', function (req, res) {
    db.collection('songs').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.render('news.ejs', {
        user: req.user,
        songs: result,
        login: true
      })
    })
  });
  app.get('/podcasts', function (req, res) {
    db.collection('songs').find().toArray((err, result) => {
      if (err) return console.log(err)
      res.render('podcasts.ejs', {
        user: req.user,
        songs: result,
        login: true
      })
    })
  });
  // LOGOUT ==============================
  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/home');
  });

  // message board routes ===============================================================

  app.post('/updateStatus', (req, res) => {
    db.collection('users').findOneAndUpdate(
      { 
        _id: ObjectId(req.user._id)
    }, {
        $set: {
          local: {
            username : req.user.local.username,
            email : req.user.local.email,
            password : req.user.local.password,
            creator : req.user.local.creator,
            profilePic : req.user.local.profilePic,
            status : req.body.mood
          }
        }
    },{
      upsert: false
    },
    (err, result) => {
      if (err) return console.log(err)
      console.log('saved to database')
      res.redirect('/profile')
    })
  })



  app.post('/songUpload', amILoggedIn, async (req,res) => {
    console.log( 'line 208', req.body)
    var songPath = uuidV4()
    try{
      const {albumArt} = req.files;
      const fileName = albumArt.name;
      const extension = path.extname(fileName);
      const URL = "/albumArt/" + songPath + extension;
      console.log(req.body.tags)

      await util.promisify(albumArt.mv)('./public' + URL );

      res.redirect('/home')
      } catch(err){
        console.log(err);
        res.status(500).json({
          message: err,
        })
        res.end()
      }
        db.collection('songs').insertOne(
          {
                user_id: ObjectId(req.user._id),
                songName: req.body.songName,
                tags: req.body.tags.split(','),
                img: "/albumArt/" + songPath + path.extname(req.files.albumArt.name),
                downloadLink: req.body.downloadLink,
                username: req.user.local.username
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

  res.redirect('/home');
}

