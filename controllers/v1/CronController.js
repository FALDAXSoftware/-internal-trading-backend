/**
 * SimplexController
 *
 */
const {
  raw
} = require('objection');
var express = require('express');
var app = express();
var moment = require('moment');
var fetch = require('node-fetch');
const Bluebird = require('bluebird');
fetch.Promise = Bluebird;
var twilio = require('twilio');
var aesjs = require('aes-js');
var mailer = require('express-mailer');

// Extra
const constants = require('../../config/constants');
// Controllers
var {
  AppController
} = require('./AppController');
var logger = require("./logger");

// Models


var request = require('request');
var xmlParser = require('xml2json');
var moment = require('moment');
var DomParser = require('dom-parser');
const image2base64 = require('image-to-base64');
var kycDocType = '';
const countryData = require('../../config/country');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
AWS
  .config
  .loadFromPath('config/aws_config.json');
var s3 = new AWS.S3({
  signatureVersion: 'v4'
});
var S3BucketName = "production-static-asset";
var s3bucket = new AWS.S3({
  params: {
    Bucket: 'production-static-asset'
  }
});

/**
 * Cron
 * It's contains all the opration related with users table. Like userList, userDetails,
 * createUser, updateUser, deleteUser and changeStatus
 */
class TradingController extends AppController {

  constructor() {
    super();
  }



}

module.exports = new TradingController();