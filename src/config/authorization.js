var jwt = require('jwt-simple');
var constants = require("./constants");
var i18n = require("i18n");
var moment = require('moment');

module.exports = async function (headers) {
    // Check authentication
    try {
        let object = {};
        if (headers.authorization && headers.authorization != "") {
            var token = headers.authorization;
            var split_token = token.split(" ")
            var get_jwt_token = split_token[1];
            var decoded = jwt.decode(get_jwt_token, require('./secret')());
            // if (decoded.exp >= Date.now()) {
            if ((moment().utc()).isAfter(moment.unix(decoded.exp).utc())) {
                // return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, i18n.__("TOKEN_EXPIRED"), []);
                return {
                    status: constants.BAD_REQUEST_CODE,
                    message: i18n.__("TOKEN_EXPIRED").message
                }
            }
            object = {
                status: constants.SUCCESS_CODE,
                user_id: decoded.id,
                isAdmin: (decoded.isAdmin && decoded.isAdmin == true ? true : false),
                admin_id: (decoded.isAdmin && decoded.isAdmin == true ? decoded.id : 0)
            }
        } else if (headers["x-api-key"]) {
            if (headers["x-api-key"] == null || headers["x-api-key"] == '') {
                return {
                    status: constants.BAD_REQUEST_CODE,
                    message: i18n.__("Api key is missing").message
                }
            }
            let api_key = headers["x-api-key"];
            let userAPIKeyHelper = require("../helpers/users/get-apikey-user");
            let getUserAPIKey = await userAPIKeyHelper.getUserApiKey(api_key);
            if ( !getUserAPIKey ) {
                return {
                    status: constants.BAD_REQUEST_CODE,
                    message: i18n.__("Api key is invalid").message
                }
            }
            object = {
                status: constants.SUCCESS_CODE,
                user_id: getUserAPIKey.user_id,
                isAdmin: false
            }
        }
        return (object)
    } catch (err) {
        console.log("err", err);
        return {
            status: constants.UNAUTHORIZED_CODE,
            message: i18n.__("UNAUTHORIZED_ACCESS").message
        }
    }
}