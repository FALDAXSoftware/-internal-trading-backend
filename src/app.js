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
  // socket.to( "join").emit("test", {name:"le bhai"});
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
    // function findClientsSocketByRoomId(roomId) {
    console.log('room.r',room);
    var roomId = room.room;
      var res = []
          , room_name = io.sockets.adapter.rooms[roomId];
      if (room_name) {
        for (var id in room_name) {
          res.push(io.sockets.adapter.nsp.connected[id]);
        }
      }
      console.log(io.sockets.adapter)
    //   return res;
    // }

    // var clients = this.findClientsSocket('room', room.room);
    console.log("clients",res);
    socket.emit("test", { name: "le bhai" });
    console.log("room",room);

    socket.join(room.room);
    // console.log("Socket", socket);
    // io.to(room.room).emit("test", {name:"le bhai"});

    let symbol = (room.room);
    let pair = (symbol).split("-")
    let user_id = authentication.user_id;


    socket.emit(constants.TRADE_BUY_BOOK_EVENT, await socket_functions.getBuyBookData(pair[0], pair[1]));
    socket.emit(constants.TRADE_SELL_BOOK_EVENT, await socket_functions.getSellBookData(pair[0], pair[1]));
    socket.emit(constants.TRADE_TRADE_HISTORY_EVENT, await socket_functions.getTradeHistoryData(pair[0], pair[1]));
    socket.emit(constants.TRADE_CARD_EVENT, await socket_functions.getCardData(symbol));
    socket.emit(constants.TRADE_DEPTH_CHART_EVENT, await socket_functions.getDepthChartData(pair[0], pair[1]));
    socket.emit(constants.TRADE_INSTRUMENT_EVENT, await socket_functions.getInstrumentData(pair[1]));
    socket.emit(constants.USER_FAVOURITES_CARD_DATA_EVENT, await socket_functions.getUserFavouritesData(user_id, socket.id))
    socket.emit(constants.USER_PORTFOLIO_DATA_EVENT, await socket_functions.getPortfolioData(user_id))
    socket.emit(constants.USER_ACTIVITY_DATA_EVENT, await socket_functions.getActivityData(user_id))

    socket.emit(constants.TRADE_USERS_COMPLETED_ORDERS_EVENT_FLAG, true);

    socket.on("trade_users_history_event", async function (data) {
      socket.emit(constants.TRADE_USERS_COMPLETED_ORDERS_EVENT, await socket_functions.getCompletedOrdersData(data));
    })
    // socket.emit(constants.TRADE_USERS_CANCELLED_ORDERS_EVENT, await socket_functions.getCancelledOrdersData( user_id, pair[0], pair[1]), 0 );
    // socket.emit(constants.TRADE_USERS_PENDING_ORDERS_EVENT, await socket_functions.getPendingOrdersData( user_id, pair[0], pair[1]), 0 );
  })
  socket.on("XRP-BTC", async function (data) {
    console.log("data", data);
    socket.emit(constants.TRADE_BUY_BOOK_EVENT, await socket_functions.getBuyBookData("XRP", "BTC"));
  })

  socket.on("market_data", async function () {
    socket.emit(constants.MARKET_VALUE_EVENT, await socket_functions.getMarketValue());
  })

});


// global.io = io;
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

var cronjobFile = require("./services/cronJobs");