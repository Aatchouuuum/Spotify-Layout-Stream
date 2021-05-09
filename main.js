var SpotifyWebApi = require('spotify-web-api-node');
let express = require('express');
var request = require('request'); // "Request" library
let session = require('express-session');
let bodyParser = require("body-parser");
let http = require('http');
let app = express ();
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
const { post } = require('request');
const { getHeapCodeStatistics } = require('v8');

const PORT = 80

// EDIT ONLY THIS PART
const DOMAINE = "http://localhost" //Yout domaine (the one you give for the spotify api)
var client_id = ''; // Your client id
var client_secret = ''; // Your secret
//---------------------------------------------------------------------



var stateKey = 'spotify_auth_state';
var redirect_uri = DOMAINE + '/callback'; // Your redirect uri
var access_token = null
var refresh_token = null
var authOptions=null

// credentials are optional
var spotifyApi = new SpotifyWebApi({
    clientId: client_id,
    clientSecret: client_secret,
    redirectUri: redirect_uri
});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

// Template & session
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret : "OnSenFouIci",
    resave : false,
    saveUninitialized : true,
    cookie : {
        path: '/',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 365 , //One year for cookies life
        secure: true
    }
}));

// roots
app.get('/', (req,res) => {
    res.render('index', {test : "Nico"});
});

app.get('/login', function(req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = 'user-read-private user-read-email user-read-playback-position user-read-recently-played user-read-playback-state user-read-currently-playing';
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }));
  });

  app.get('/callback', function(req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null ) {//|| state !== storedState
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
      res.clearCookie(stateKey);
       authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code: code,
          redirect_uri: redirect_uri,
          grant_type: 'authorization_code'
        },
        headers: {
          'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
      };

      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {

          access_token = body.access_token
          refresh_token = body.refresh_token

          var options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };

          spotifyApi.setAccessToken(body.access_token);

          getData( (data)=>{
            res.render('layout', data)
          })

        } else {
          res.redirect('/#' +
            querystring.stringify({
              error: 'invalid_token'
            }));
        }
      });


    }
  });

  app.post('/refresh_token', function(req, res) {
    // console.log("token");
    try {
      // requesting access token from refresh token
      var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
          grant_type: 'refresh_token',
          refresh_token: refresh_token
        },
        json: true
      };

      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {

          spotifyApi.setAccessToken(body.access_token);

          console.log("new token generated");

          res.json({
            'token_refresh': "ok"
          });
        }else{
          res.json({
            'token_refresh': error
          });
        }
      });
    } catch (error) {
      console.log("Error in refresh_token");
      console.log(error);
      res.json({"token_refresh":error})
    }
  });

  app.post('/actuData', (req, res) => {
    //console.log("actuData");
    try {
      getData(data => {
        res.json(data)
      })
    } catch (error) {
      console.log("Error in actuData");
      console.log(error);
      res.json({"error":"error"})
    }
  });

  app.get('/obsLayout', (req, res) => {
    getData( (data)=>{
      res.render('layout', data)
    })
  });




app.use(express.static('static/'));

//default case -> 404 not found
app.get('*', (req, res) => {
    res.redirect('/err404');
});

http.createServer(app).listen(PORT);
console.log('server started')



function getData(callback){
    spotifyApi.getMyCurrentPlaybackState()
        .then(function(data) {

            let toRet ={
                isPlaying:false,
                title : null,
                img : null,
                artists : null,
                prog : 0,
                totTime : 0
            }

            if (data.body && data.body.is_playing) {
                toRet.isPlaying = true
                toRet.img = data.body.item.album.images[0].url
                toRet.title = data.body.item.name
                toRet.prog = data.body.progress_ms,
                toRet.totTime = data.body.item.duration_ms
                toRet.artists = ""

                for(let i = 0; i<data.body.item.artists.length; i++){
                    toRet.artists += data.body.item.artists[i].name
                    if(i!=data.body.item.artists.length-1) toRet.artists += ", "
                }
            }

            callback(toRet)
        }, function(err) {
            console.log('Something went wrong!', err);
        });
}
