var express = require('express');
var fs = require('fs')
var path = require('path');
var bodyParser = require('body-parser');
var cors = require('cors');
var dotenv = require('dotenv');
var app = express();
var https = require('https');
var http = require('http');
var mailer = require('express-mailer');
var i18n = require("i18n");
var session = require('express-session')
var server = http.createServer(app);
var io = require('socket.io')(server);
app.set('socketObject', io);

app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: require("./config/secret")
}));
app.use(cors())

dotenv.load(); // Configuration load (ENV file)
// Json parser
app.use(bodyParser.json({
  limit: "2.7mb",
  extended: false
}));
app.use(bodyParser.urlencoded({
  limit: "2.7mb",
  extended: false
}));
// Set views folder for emails
app.set('views', __dirname + '/views');
// Set template engin for view files
app.set('view engine', 'ejs');
// SMTP setting

// Configure Locales
i18n.configure({
  locales: ['en', 'de'],
  directory: __dirname + '/locales',
  register: global
});

app.use(i18n.init);

mailer.extend(app, {
  from: process.env.EMAIL_DEFAULT_SENDING,
  host: process.env.EMAIL_HOST, // hostname
  secureConnection: true, // use SSL
  port: 465, // port forSMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  transportMethod: process.env.EMAIL_TRANSPORT_METHOD
});

app.all('/*', function (req, res, next) {
  // CORS headers
  res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // Set custom headers for CORS
  // res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token');
  if (req.headers.language) { // If header send language, then set to that language
    i18n.setLocale(req.headers.language);
  }
  if (req.method == 'OPTIONS') {
    res
      .status(200)
      .end();
  } else {
    next();
  }
});

app.set("pairData", {
  crypto: "ETH",
  currency: "BTC"
});

// Socket Implementation //Socket config
io.on('connection', function (socket) {
  console.log("Socket connected.....");
})
global.io = io;
// Socket Ends

//Routes
app.use(function (req, res, next) {
  res.header('X-Powered-By', 'FALDAX');
  // res.removeHeader('X-Powered-By');
  next();
});
app.use('/api/v1/tradding/', require('./routes/index'));

// Start the server
app.set('port', process.env.PORT);
server.listen(app.get('port'), function () {
  console.log(process.env.PROJECT_NAME + " Application is running on " + process.env.PORT + " port....");
});