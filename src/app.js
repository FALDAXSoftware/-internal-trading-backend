var dotenv = require('dotenv');

dotenv.load(); // Configuration load (ENV file)

// if (process.env.ENVIROMENT == "preprod") {
//   // Add this to the VERY top of the first file loaded in your app
//   var apm = require('elastic-apm-node').start({
//     // Override service name from package.json
//     // Allowed characters: a-z, A-Z, 0-9, -, _, and space
//     serviceName: "internal-trading-preprod-faldax",

//     // Set custom APM Server URL (default: http://localhost:8200)
//     serverUrl: 'http://apm.orderhive.plus:8200'
//   })
// }

var amqp = require('amqplib/callback_api');
let CONN_URL = process.env.QUEUE_URL;
const opt = { credentials: require('amqplib').credentials.plain(process.env.QUEUE_USERNAME, process.env.QUEUE_PASSWORD) };
let ch = null;
amqp.connect(CONN_URL, opt, (err, conn) => {
  // console.log("err", err)
  // console.log("conn", conn)
  conn.createChannel(function (err, ch) {
    // ch.consume('user-messages', function (msg) {
    //   console.log('.....');
    //   setTimeout(function () {
    //     console.log("Message:", msg.content.toString());
    //   }, 4000);
    // }, { noAck: true }
    // );
  });
});


var express = require('express');
var fs = require('fs')
var path = require('path');
var bodyParser = require('body-parser');
var cors = require('cors');
var app = express();
var https = require('https');
var http = require('http');
var mailer = require('express-mailer');
var i18n = require("i18n");
var session = require('express-session')
var server = http.createServer(app);

// const redis = require("redis");
// const axios = require("axios");
// const port_redis = 6379;

// var io = require('socket.io')(server);
var io = require('socket.io')(server, {
  handlePreflightRequest: (req, res) => {
    const headers = {
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Origin": req.headers.origin, //or the specific origin you want to give access to,
      "Access-Control-Allow-Credentials": true
    };
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
  locales: ['en', 'ja'],
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
  if (req.headers["accept-language"]) { // If header send language, then set to that language
    i18n.setLocale(req.headers["accept-language"]);
  }
  if (req.method == 'OPTIONS') {
    res
      .status(200)
      .end();
  } else {
    next();
  }
});

// app.set("pairData", {
//   crypto: process.env.CRYPTO,
//   currency: process.env.CURRENCY
// });

// Socket Implementation //Socket config

io.on('connection', async function (socket) {
  var
    constants = require("./config/constants");
  socket.to("join").emit("test", { name: "le bhai" });
  var socket_headers = socket.request.headers;
  // console.log("socket_headers", socket_headers);
  // if ((!socket_headers.authorization || socket_headers.authorization == undefined || socket_headers.authorization == "") || (!socket_headers["x-api-key"] || socket_headers["x-api-key"] == undefined || socket_headers["x-api-key"] == "") ) {
  //   console.log("No auth");
  //   return Error("Not authorized")
  // }
  var authentication = await require("./config/authorization")(socket_headers);
  // console.log("authentication", authentication);
  var rooms = Object.keys(io.sockets.adapter.sids[socket.id]);
  if (authentication.status > constants.SUCCESS_CODE) {
    socket.emit(constants.USER_LOGOUT, true);
  }

  let socket_functions = require("./helpers/sockets/emit-all-data");

  socket.on("join", async function (room) {
    socket.emit("test", { name: "le bhai" });
    if (authentication.status > 200) {
      socket.emit(constants.USER_LOGOUT, true);
    }

    // socket.set('transports', ['websocket']);

    console.log("room", room)

    var user_id = ((authentication.isAdmin == true) ? process.env.TRADEDESK_USER_ID : authentication.user_id);
    if (room.previous_room) {
      socket.leave(room.previous_room);
      let previous_pair = (room.previous_room).split("-");
      socket.leave(previous_pair[1]);
      socket.leave(room.previous_room + user_id);
    }
    let symbol = (room.room);
    let pair = (symbol).split("-")

    socket.join(room.room); //Join to new  Room
    socket.join(room.room + user_id); // Join to new Room with Userid
    // socket.join(pair[1]); // Join to new Currency Room

    if (authentication.isAdmin == true) {
      console.log("INSIDE ADMIN");
      socket.emit(constants.TRADE_PRECISION, await socket_functions.getTradePrecision(symbol));
    }

    console.log("user_id", user_id);
    console.log("symbol", symbol)
    console.log("socket", socket)
    console.log("socket.id", socket.id)

    socket.emit(constants.TRADE_USERS_COMPLETED_ORDERS_EVENT_FLAG, true);
    socket.emit(constants.TRADE_USER_WALLET_BALANCE, await socket_functions.getUserBalance(user_id, pair[0], pair[1]));
    socket.emit(constants.TRADE_TRADE_HISTORY_EVENT, await socket_functions.getTradeHistoryData(pair[0], pair[1]));
    socket.emit(constants.TRADE_HIGH_LEVEL_INFO, await socket_functions.getHighInfo(symbol));
    socket.emit(constants.TRADE_SPREAD_VALUE, await socket_functions.getSpreadValue(symbol));
    socket.emit(constants.TRADE_BUY_BOOK_EVENT, await socket_functions.getBuyBookDataSummary(pair[0], pair[1]));
    socket.emit(constants.TRADE_SPREAD_VALUE, await socket_functions.getSpreadValue(symbol));
    socket.emit(constants.TRADE_SELL_BOOK_EVENT, await socket_functions.getSellBookDataSummary(pair[0], pair[1]));
    socket.emit(constants.LATEST_TRADEVALUE, await socket_functions.getLatestValue(symbol))
    // await Promise.all([
    // ])

    socket.on("change-instrument-data", async function (data) {
      socket.emit(constants.TRADE_INSTRUMENT_EVENT, await socket_functions.getInstrumentData(data.coin));
    })

    socket.on('disconnect', function () {
      // this returns a list of all rooms this user is in
      var rooms = io.sockets.manager.roomClients[socket.id];
      for (var room in rooms) {
        socket.leave(room);
      }
    });

    // socket.emit(constants.TRADE_USERS_CANCELLED_ORDERS_EVENT, await socket_functions.getCancelledOrdersData( user_id, pair[0], pair[1]); 0 );
    // socket.emit(constants.TRADE_USERS_PENDING_ORDERS_EVENT, await socket_functions.getPendingOrdersData( user_id, pair[0], pair[1]), 0 );

  })

  socket.on("trade_users_history_event", async function (data) {
    var socket_headers = socket.request.headers;
    var authentication = await require("./config/authorization")(socket_headers);
    if (authentication.status > constants.SUCCESS_CODE) {
      socket.emit(constants.USER_LOGOUT, true);
    }
    var user_id = ((authentication.isAdmin == true) ? process.env.TRADEDESK_USER_ID : authentication.user_id);
    data.user_id = user_id
    socket.emit(constants.TRADE_GET_USERS_ALL_TRADE_DATA, await socket_functions.getUserOrdersData(data));
  })

  socket.on("user_wallet_data", async function (data) {
    console.log("data", data)
    var socket_headers = socket.request.headers;
    var authentication = await require("./config/authorization")(socket_headers);
    if (authentication.status > constants.SUCCESS_CODE) {
      socket.emit(constants.USER_LOGOUT, true);
    }

    socket.emit(constants.USER_AFTER_WALLET_BALANCE, await socket_functions.getUserBalance(data.user_id, data.crypto, data.currency));
  })

  socket.on("tier-0-trade-limit", async function (data) {

    console.log("data", data)
    var socket_headers = socket.request.headers;
    var authentication = await require("./config/authorization")(socket_headers);
    if (authentication.status > constants.SUCCESS_CODE) {
      socket.emit(constants.USER_LOGOUT, true);
    }


    // var user_id = ((authentication.isAdmin == true) ? process.env.TRADEDESK_USER_ID : authentication.user_id);
    // socket.join(data.symbol); //Join to new  Room
    console.log("data.symbol", data.symbol)
    // console.log("user_id", user_id)
    console.log("data.amount", data.amount)
    if (data.amount == null) {
      data.amount = 0.0;
    }
    // socket.join(data.symbol + data.user_id); // Join to new Room with Userid
    // data.user_id = user_id
    console.log("data", data)
    socket.emit(constants.TRADE_LIMIT, await socket_functions.tier0TradeLimit(data));
  })

  socket.on("get-limit-stop-latest", async function (data) {
    var socket_headers = socket.request.headers;
    var authentication = await require("./config/authorization")(socket_headers);
    if (authentication.status > constants.SUCCESS_CODE) {
      socket.emit(constants.USER_LOGOUT, true);
    }
    socket.emit(constants.LATEST_TRADEVALUE, await socket_functions.getLatestValue(data.symbol));
  })

  // Temp FIXAPI
  socket.on("check-offer-code", async function (data) {
    let check_offer = require("./helpers/fixapi/check-offer-code-status");
    socket.emit("offercode-data", await check_offer.offerCodeStatus(data));
  })

  socket.on("conversion-data-incoming", async function (data) {
    var socket_headers = socket.request.headers;
    var authentication = await require("./config/authorization")(socket_headers);
    if (authentication.status > constants.SUCCESS_CODE) {
      socket.emit(constants.USER_LOGOUT, true);
    }
    var user_id = ((authentication.isAdmin == true) ? process.env.TRADEDESK_USER_ID : authentication.user_id);
    data.user_id = user_id;
    let jst_value = require("./controllers/v1/FixApiController");
    socket.emit("conversion-data-outgoing", await jst_value.getConversionPrice(data))
  })
  socket.on("market_data", async function () {
    socket.emit(constants.MARKET_VALUE_EVENT, await socket_functions.getMarketValue());
  })
});
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

CronSendEmail = async (requestedData) => {
  var moment = require("moment");
  var EmailTemplate = require("./models/EmailTemplate");
  var template_name = requestedData.template;
  var email = requestedData.email;
  // var body = requestedData.body;
  // var extraData = requestedData.extraData;
  // var subject = requestedData.subject;
  var user_detail = requestedData.user_detail;
  var user_detail = requestedData.user_detail;
  var format_data = requestedData.formatData;

  let user_language = (user_detail.default_language ? user_detail.default_language : 'en');
  let template = await EmailTemplate.getSingleData({
    slug: requestedData.templateSlug
  });

  // let template = await EmailTemplate.getSingleData({
  //   slug: requestedData.templateSlug
  // });

  let language_content = template.all_content[user_language].content;
  let language_subject = template.all_content[user_language].subject;
  let tradeData = '';

  if (format_data.allTradeData) {
    // console.log("allTradeData", allTradeData.length)
    var sortedOrderData = format_data.allTradeData;
    // console.log("sortedOrderData", sortedOrderData)
    sortedOrderData.sort(function (a, b) { return b.id - a.id });
    const allTradeData = sortedOrderData;
    // console.log("allTradeData", allTradeData)
    tradeData += '<table style="border:1px solid #888;border-collapse:collapse;border-spacing:0;font-size:13px;">'
    tradeData += '<tr>'
    tradeData += `<th style="border:1px solid #888;border-collapse:collapse;padding:10px;text-align:center;">Filled Quantity(${allTradeData[0].settle_currency})</th>`
    tradeData += `<th style="border:1px solid #888;border-collapse:collapse;padding:10px;text-align:center;">Unfilled Quantity(${allTradeData[0].settle_currency})</th>`
    tradeData += `<th style="border:1px solid #888;border-collapse:collapse;padding:10px;text-align:center;">Trade Price(${allTradeData[0].currency})</th>`
    tradeData += `<th style="border:1px solid #888;border-collapse:collapse;padding:10px;text-align:center;">Datetime</th>`
    tradeData += '</tr>'
    for (let i = 0; i < allTradeData.length; i++) {
      const remaining = parseFloat(allTradeData[i].fix_quantity) - parseFloat(allTradeData[i].quantity);
      const datetime = moment(allTradeData[i].created_at).local().format("YYYY-MM-DD HH:mm")
      tradeData += '<tr>'
      tradeData += `<td style="border:1px solid #888;border-collapse:collapse;padding:10px;text-align:center;">${(allTradeData[i].quantity).toFixed(8)}</td>`;
      tradeData += `<td style="border:1px solid #888;border-collapse:collapse;padding:10px;text-align:center;">${(remaining).toFixed(8)}</td>`;
      tradeData += `<td style="border:1px solid #888;border-collapse:collapse;padding:10px;text-align:center;">${(allTradeData[i].fill_price).toFixed(8)}</td>`;
      tradeData += `<td style="border:1px solid #888;border-collapse:collapse;padding:10px;text-align:center;">${datetime}</td>`;
      tradeData += '</tr>'
    }
    tradeData += '</table>'
  }

  format_data.allTradeData = tradeData;
  var emailContent = require("./helpers/helpers")
  language_content = await emailContent.formatEmail(language_content, format_data);

  var object = {
    to: email,
    subject: language_subject,
    content: (language_content),
    PROJECT_NAME: process.env.PROJECT_NAME,
    SITE_URL: process.env.SITE_URL,
    homelink: process.env.SITE_URL
  }

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
        // console.log("err", JSON.stringify(err))
        if (err) {
          return 0;
        } else {
          return 1;
        }
      });
  } catch (err) {
    // console.log("EMail err:", JSON.stringify(err));
    return 0;
  }
}

module.exports = { CronSendEmail: CronSendEmail };

var cronjobFile = require("./services/cronJobs");
