/* Common functions which can be used anywhere */
var constants = require("../config/constants");
// Used for Response Output in JSON Format
var jsonFormat = async (res, status, message, data, extra = "") => {

  // if (status == 500) {
  //   var output = {
  //     "status": status,
  //     "err": message,
  //     "data": data
  //   };
  // } else {
  var output = {
    "status": status,
    "message": message,
    "data": data
  };
  // }
  if (extra != "") {
    output.extra = extra;
  }
  return res.json(output);
}

// To Generate Random Alphanumberic String
var randomString = (length) => {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
  return result;
}

// SMS Sending Function

var sendSMS = async (requestedData) => {
  // console.log("INSIDE SMS", requestedData);
  var SmsTemplate = require("../models/SmsTemplate");
  var twilio = require('twilio');
  var template_name = requestedData.template;
  var email = requestedData.email;
  var user_detail = requestedData.user_detail;
  var format_data = requestedData.formatData;
  let template = await SmsTemplate.getSingleData({
    slug: requestedData.templateSlug
  });

  // console.log("template", template)

  let language_content = template.content;
  var value = {};
  value.recipientName = user_detail.first_name
  if (format_data.reason) {
    value.reason = format_data.reason;
  }
  language_content = await module.exports.formatEmail(language_content, value);
  // console.log("language_content", language_content)
  // console.log("process.env.TWILLIO_ACCOUNT_SID", process.env.TWILLIO_ACCOUNT_SID)
  var account_sid = await module.exports.getDecryptData(process.env.TWILLIO_ACCOUNT_SID);
  var accountSid = account_sid; // Your Account SID from www.twilio.com/console
  // console.log("accountSid", accountSid)
  var authToken = await module.exports.getDecryptData(process.env.TWILLIO_ACCOUNT_AUTH_TOKEN); // Your Auth Token from www.twilio.com/console
  // console.log("authToken", authToken)
  var accountNumber = process.env.TWILLIO_ACCOUNT_FROM_NUMBER
  var user_id = user_detail.id;

  // console.log("language_content", language_content)

  //Twilio Integration
  var client = new twilio(accountSid, authToken);
  //Sending SMS to users 
  client.messages.create({
    body: language_content,
    to: user_detail.phone_number, // Text this number
    from: accountNumber // From a valid Twilio number
  }).then((message) => {
    // console.log("message", message)
    return (1);
  })
    .catch((err) => {
      // console.log("ERROR >>>>>>>>>>>", err)
    })
}

// Common Customized Mailer Function to send mail
var SendEmail = async (res, requestedData) => {
  // console.log(requestedData)
  if (res == null) {
    var express = require('express');
    var app = express();
    var response = require("../app");
    await response.CronSendEmail(requestedData)
    // res = app;
    return 1;
  }
  // console.log(res)
  var EmailTemplate = require("../models/EmailTemplate");
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

  // let language_content = template.all_content[user_language].content;
  // let language_subject = template.all_content[user_language].subject;

  let language_content = template.all_content[user_language].content;
  let language_subject = template.all_content[user_language].subject;
  let tradeData = '';

  if (format_data.allTradeData) {
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
  language_content = await module.exports.formatEmail(language_content, format_data);

  // console.log(language_content)

  try {
    await res.mailer
      .send(template_name, {
        to: email,
        subject: language_subject,
        content: (language_content),
        PROJECT_NAME: process.env.PROJECT_NAME,
        SITE_URL: process.env.SITE_URL,
        homelink: process.env.SITE_URL
      }, function (err) {
        // console.log("err", err)
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

// Format Email
var formatEmail = async (emailContent, data) => {
  let rex = /{{([^}]+)}}/g;
  let key;
  // console.log("data", JSON.stringify(data));
  if ("object" in data) {
    data = data.object;
  }
  var tempEmailContent = emailContent;
  while (key = rex.exec(emailContent)) {
    var temp_var = '';
    if (Array.isArray(data[key[1]])) {
      temp_var = ''
      data[key[1]].forEach(function (each, index) {
        temp_var += JSON.stringify(each) + '<br>'
      })
    } else {
      temp_var = data[key[1]];
    }
    // tempEmailContent = tempEmailContent.replace(key[0], data[key[1]] ? data[key[1]] : '');
    tempEmailContent = tempEmailContent.replace(key[0], data[key[1]] ? temp_var : '');
  }
  // console.log("tempEmailContent", tempEmailContent)
  return tempEmailContent;
}

// Get User ID
var getUserId = async function (headers, res) {
  var authorization = headers;
  // console.log("authorization", JSON.stringify(authorization));
  var authentication = await require("../config/authorization")(authorization);
  // console.log("authentication", JSON.stringify(authentication))
  if (authentication.status != constants.SUCCESS_CODE) {
    return res.status(authentication.status).json(authentication);
  }
  let user_id = authentication.user_id;
  if (authentication.isAdmin) {
    user_id = process.env.TRADEDESK_USER_ID;
  }
  return user_id;
}

// Check Bot or Actual User
var checkWhichUser = function (user_id) {
  let check = false;
  if (user_id == process.env.TRADEDESK_USER_ID) {
    check = true;
  }
  return check;
}

// Generate Trasnsaction group
var generateTxGroup = function (user_id) {
  var result = '';
  let length = 48;
  let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
  var current_date = new Date();
  current_date = current_date.getTime();
  return values = ("txg_" + user_id + current_date + result).toLocaleLowerCase();

}

var getDecryptData = (value) => {
  try {
    var aesjs = require('aes-js');
    var decryptData;
    var key = JSON.parse(process.env.SECRET_KEY);
    var iv = JSON.parse(process.env.SECRET_IV);
    // console.log("value", value);
    // console.log()
    // When ready to decrypt the hex string, convert it back to bytes
    var encryptedBytes = aesjs.utils.hex.toBytes(value);
    // The output feedback mode of operation maintains internal state,
    // so to decrypt a new instance must be instantiated.
    var aesOfb = new aesjs.ModeOfOperation.ofb(key, iv);
    var decryptedBytes = aesOfb.decrypt(encryptedBytes);

    // Convert our bytes back into text
    var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
    return (decryptedText);
  } catch (err) {
    // console.log(err)
  }
}

module.exports = {
  jsonFormat,
  randomString,
  SendEmail,
  formatEmail,
  getUserId,
  checkWhichUser,
  generateTxGroup,
  getDecryptData,
  sendSMS
}

