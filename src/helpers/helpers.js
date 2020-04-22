/* Common functions which can be used anywhere */

// Used for Response Output in JSON Format
var jsonFormat = async (res, status, message, data, extra = "") => {
  var output = {
    "status": status,
    "message": message,
    "data": data
  };
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


// Common Customized Mailer Function to send mail
var SendEmail = async (res, requestedData) => {
  console.log(res)
  if (res == null) {
    var express = require('express');
    var app = express();
    var response = require("../app");
    await response.CronSendEmail(requestedData)
    // res = app;
    return 1;
  }
  console.log(res)
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

  let language_content = template.all_content[user_language].content;
  let language_subject = template.all_content[user_language].subject;

  language_content = await module.exports.formatEmail(language_content, format_data);

  console.log(language_content)

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

// Format Email
var formatEmail = async (emailContent, data) => {
  let rex = /{{([^}]+)}}/g;
  let key;
  console.log("data", data);
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
  return tempEmailContent;
}

// Get User ID
var getUserId = async function (headers) {
  var authorization = headers;
  var authentication = require("../config/authorization")(authorization);
  let user_id = authentication.user_id;
  if( authentication.isAdmin ){
    user_id = process.env.TRADEDESK_USER_ID;
  }
  return user_id;
}

// Check Bot or Actual User
var checkWhichUser = function (user_id) {
  let check = false;
  if( user_id == process.env.TRADEDESK_USER_ID ){
    check = true;
  }
  return check;
}

module.exports = {
  jsonFormat,
  randomString,
  SendEmail,
  formatEmail,
  getUserId,
  checkWhichUser
}

