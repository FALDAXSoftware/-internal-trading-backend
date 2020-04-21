var jwt = require('jwt-simple');
var constants = require("./constants");
var i18n = require("i18n");
module.exports = function (headers) {
    if (!headers.authorization || headers.authorization == "") {
        // return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, i18n.__("TOKEN_EXPIRED"), []);
    }
    // Check authentication
    var token = headers.authorization;
    var split_token = token.split(" ")
    var get_jwt_token = split_token[1];
    try {
        var decoded = jwt.decode(get_jwt_token, require('./secret')());
        if (decoded.exp <= Date.now()) {
            // return Helper.jsonFormat(res, constants.BAD_REQUEST_CODE, i18n.__("TOKEN_EXPIRED"), []);
            return {
                status: constants.BAD_REQUEST_CODE,
                message: i18n.__("TOKEN_EXPIRED").message
            }
        }
        return {
            status: constants.SUCCESS_CODE,
            user_id: decoded.id,
            isAdmin: (decoded.isAdmin && decoded.isAdmin == true ? true : false),
            admin_id: (decoded.isAdmin && decoded.isAdmin == true ? decoded.id : 0)
        }
    } catch (err) {
        return {
            status: constants.UNAUTHORIZED_CODE,
            message: i18n.__("UNAUTHORIZED_ACCESS").message
        }
    }
}