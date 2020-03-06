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
  transportMethod: "SMTP",
  // testMode: false
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
  // console.log(socket)
  // console.log("socket conetcted", socket.handshake); var userId =
  // socket.handshake.query['id']; console.log("Session User Id >>>>>>>>>>>>>>",
  // userId);
  // socket
  //   .on("join", function (room) {
  //     console.log(room)
  //     socket
  //       .on('home_card_coin', function () {
  //         currencyConversion.getRecentValue(io);
  //       })
  //     socket.on('rising_falling', function () {
  //       risingFalling.getRecentRisingFallingValue(io);
  //     })
  //     if (room.old) {
  //       socket.leave(room.old);
  //     }
  //     socket.join(room.new);
  //     socketData.getTradeDataSell(room.new, io, socket.id);
  //   });
  // socket.on('pending_history_userid',async function (data) {

  //   var userid = User.decript_id(data.user_id);
  //   var symbol = data.symbol;
  //   var data = symbol.split("-");
  //   var currency = data[1];
  //   var crypto = data[0];
  //   var pending_history = await pendingbook.get_PendingOrderDetailsPair(crypto, currency, userid);
  //   var pending_array = {
  //     data: [...pending_history],
  //     status: 200
  //   };
  //   if (pending_history.length == 0) {
  //     pending_array.message = "No Data Found",
  //     pending_array.status = 204
  //   }
  //   io
  //     .to(socket.id)
  //     .emit('pending_history', pending_array);
  //   // socketData.getUserPendingHistory(data.user_id, data.symbol, io, socket.id);
  // })

  // socket.on('card_data_userid', function (data) {
  //   socketData.getUserCardData(data.user_id, io, socket.id);
  // })
  // // setTimeout(() => {   socket.emit("test", {data: true}); }, 2000);
  // // setTimeout(() => {   socket.emit("test2", {data: false}); }, 3000);
  // socket.on("change", function (data) {
  // app.set("pairData", data);

})
// });


//Routes
app.use('/api/v1/tradding/', require('./routes/index'));

// Start the server
app.set('port', process.env.PORT);
server.listen(app.get('port'), function () {
  console.log(process.env.PROJECT_NAME + " Application is running on " + process.env.PORT + " port....");
});