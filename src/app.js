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
// var io = require('socket.io')(server);
var io = require('socket.io')(server, {
  handlePreflightRequest: (req, res) => {
    console.log(req.headers)
    const headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
      "Access-Control-Allow-Credentials": true
    };
    console.log(headers)
    res.writeHead(200, headers);
    res.end();
  }
});

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
  res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token, Authorization');
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
  crypto: "XRP",
  currency: "BTC"
});

// Socket Implementation //Socket config

io.on('connection', async function (socket) {
  console.log("Socket connected.....");
  socket.to( "join").emit("test", {name:"le bhai"});
  var socket_headers = socket.request.headers;

  // console.log("socket_headers",socket_headers)
  console.log("Auth", socket_headers.authorization);
  if (!socket_headers.authorization || socket_headers.authorization == undefined || socket_headers.authorization == "") {
    return Error("Not authorized")
  }
  var authentication = require("./config/authorization")(socket_headers);
  // console.log("Socket Headers", socket_headers);
  var rooms = Object.keys(io.sockets.adapter.sids[socket.id]);


  console.log("RRRRR", rooms)
  let socket_functions = require("./helpers/sockets/emit-all-data");
  var constants = require("./config/constants");
  socket.on("join", async function (room) {
    socket.emit("test", { name: "le bhai" });
    let user_id = authentication.user_id;
    if( room.previous_room ){
      socket.leave(room.previous_room);
      let previous_pair = (room.previous_room).split("-");
      socket.leave(previous_pair[1]);
      socket.leave(room.previous_room+user_id);
    }
    let symbol = (room.room);
    let pair = (symbol).split("-")
    // console.log("room",room.room);
    socket.join(room.room); //Join to new  Room
    socket.join(room.room+user_id); // Join to new Room with Userid
    socket.join(pair[1]); // Join to new Currency Room
    // console.log("Socket", socket);
    // io.to(room.room).emit("test", {name:"le bhai"});

    socket.emit(constants.TRADE_BUY_BOOK_EVENT, await socket_functions.getBuyBookData(pair[0], pair[1]));
    socket.emit(constants.TRADE_SELL_BOOK_EVENT, await socket_functions.getSellBookData(pair[0], pair[1]));
    socket.emit(constants.TRADE_TRADE_HISTORY_EVENT, await socket_functions.getTradeHistoryData(pair[0], pair[1]));
    socket.emit(constants.TRADE_USER_WALLET_BALANCE, await socket_functions.getUserBalance(user_id, pair[0], pair[1]));
    socket.emit(constants.TRADE_CARD_EVENT, await socket_functions.getCardData(symbol));
    socket.emit(constants.TRADE_DEPTH_CHART_EVENT, await socket_functions.getDepthChartData(pair[0], pair[1]));
    socket.emit(constants.TRADE_INSTRUMENT_EVENT, await socket_functions.getInstrumentData(pair[1]));
    socket.emit(constants.USER_FAVOURITES_CARD_DATA_EVENT, await socket_functions.getUserFavouritesData(user_id, socket.id))
    socket.emit(constants.USER_PORTFOLIO_DATA_EVENT, await socket_functions.getPortfolioData(user_id))
    socket.emit(constants.USER_ACTIVITY_DATA_EVENT, await socket_functions.getActivityData(user_id))

    socket.emit(constants.TRADE_USERS_COMPLETED_ORDERS_EVENT_FLAG, true);

    socket.on("trade_users_history_event", async function (data) {
      data.user_id = user_id
      socket.emit(constants.TRADE_GET_USERS_ALL_TRADE_DATA, await socket_functions.getUserOrdersData(data));
    })

    socket.on("change-instrument-data", async function (data) {
      socket.emit(constants.TRADE_INSTRUMENT_EVENT, await socket_functions.getInstrumentData(data.coin));
    })

    // socket.emit(constants.TRADE_USERS_CANCELLED_ORDERS_EVENT, await socket_functions.getCancelledOrdersData( user_id, pair[0], pair[1]), 0 );
    // socket.emit(constants.TRADE_USERS_PENDING_ORDERS_EVENT, await socket_functions.getPendingOrdersData( user_id, pair[0], pair[1]), 0 );

  })
  // socket.on("XRP-BTC", async function (data) {
  //   console.log("data", data);
  //   socket.emit(constants.TRADE_BUY_BOOK_EVENT, await socket_functions.getBuyBookData("XRP", "BTC"));
  // })
  // Temp FIXAPI
  socket.on("check-offer-code", async function (data) {
    console.log("Check Offer");
    console.log(data);
    let check_offer = require("./helpers/fixapi/check-offer-code-status");
    socket.emit("offercode-data", await check_offer.offerCodeStatus(data));
  })
  socket.on("market_data", async function () {
    socket.emit(constants.MARKET_VALUE_EVENT, await socket_functions.getMarketValue());
  })



});
global.io = io;
// // var rooms = Object.keys(global.io.sockets.adapter.sids[socket.id]);
// var rooms = Object.keys(global.io);
// console.log("rooms:",rooms);
// var constants = require("./config/constants");
// let socket_functions = require("./helpers/sockets/emit-all-data");
// global.io.on("XRP-BTC", async function(socket){
//   console.log("socket",socket);
//   socket.emit(constants.TRADE_BUY_BOOK_EVENT, await socket_functions.getBuyBookData( "XRP","BTC" ));
// });

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

CronSendEmail = async (requestedData) => {
  // console.log(res)
  console.log("IN app.js")
  var EmailTemplate = require("./models/EmailTemplate");
  var template_name = requestedData.template;
  var email = requestedData.email;
  // var body = requestedData.body;
  // var extraData = requestedData.extraData;
  // var subject = requestedData.subject;
  var user_detail = requestedData.user_detail;
  var format_data = requestedData.formatData;

  let user_language = (user_detail.default_language ? user_detail.default_language : 'en');

  let template = await EmailTemplate.getSingleData({
    slug: requestedData.templateSlug
  });

  let language_content = template.all_content[user_language].content;
  let language_subject = template.all_content[user_language].subject;

  var emailContent = require("./helpers/helpers")
  language_content = await emailContent.formatEmail(language_content, format_data);

  console.log(language_content)
  console.log("template_name", template_name)
  var object = {
    to: email,
    subject: language_subject,
    content: (language_content),
    PROJECT_NAME: process.env.PROJECT_NAME,
    SITE_URL: process.env.SITE_URL,
    homelink: process.env.SITE_URL
  }
  console.log(object)

  try {
    await app.mailer
      .send(template_name, {
        to: email,
        subject: language_subject,
        content: (language_content),
        PROJECT_NAME: process.env.PROJECT_NAME,
        SITE_URL: process.env.SITE_URL,
        homelink: process.env.SITE_URL
      }, function (err) {
        console.log("err", err)
        if (err) {
          return 0;
        } else {
          return 1;
        }
      });
  } catch (err) {
    console.log("EMail err:", err);
    return 0;
  }
}

module.exports = { CronSendEmail: CronSendEmail };

var cronjobFile = require("./services/cronJobs");