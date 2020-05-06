var jwt = require('jwt-simple');
var constants = require("./constants");
var i18n = require("i18n");
var moment = require('moment');
var userModel = require('../models/UsersModel');

module.exports = async function (headers) {
    if (!headers.authorization || headers.authorization == "") {
        // return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, i18n.__("TOKEN_EXPIRED"), []);
    }
    // Check authentication
    var token = headers.authorization;
    var split_token = token.split(" ")
    var get_jwt_token = split_token[1];
    try {
        var decoded = jwt.decode(get_jwt_token, require('./secret')());
        console.log("decoded",decoded);
        // if (decoded.exp >= Date.now()) {
        if( (moment().utc()).isAfter( moment.unix(decoded.exp).utc() ) ){
            // return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, i18n.__("TOKEN_EXPIRED"), []);
            return {
                status: constants.BAD_REQUEST_CODE,
                message: i18n.__("TOKEN_EXPIRED").message
            }
        }
        // Check if institutional account, and yes, then check API key
        if( decoded.isAdmin == undefined  ){
            if( !headers["x-api-key"] || headers["x-api-key"] == null || headers["x-api-key"] == '' ){
                return {
                    status: constants.BAD_REQUEST_CODE,
                    message: i18n.__("Api key is missing").message
                }
            }
            let api_key = headers["x-api-key"];

            let getUserData = await userModel.getSingleData({id:decoded.id});
            let userAPIKeyHelper = require("../helpers/users/get-user-api-key");
            let getUserAPIKey = await userAPIKeyHelper.getUserAPIKey(decoded.id);

            if( getUserData.is_institutional_account && getUserAPIKey && getUserAPIKey.api_key != api_key ){
                return {
                    status: constants.BAD_REQUEST_CODE,
                    message: i18n.__("Api key is invalid").message
                }
            }
        }

        return {
            status: constants.SUCCESS_CODE,
            user_id: decoded.id,
            isAdmin: (decoded.isAdmin && decoded.isAdmin == true ? true : false),
            admin_id: (decoded.isAdmin && decoded.isAdmin == true ? decoded.id : 0)
        }
    } catch (err) {
        console.log("err",err);
        return {
            status: constants.UNAUTHORIZED_CODE,
            message: i18n.__("UNAUTHORIZED_ACCESS").message
        }
    }
}