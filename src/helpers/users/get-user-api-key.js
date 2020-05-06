/* To get User API Keys */
var userDetails = require("../../models/UsersModel");
var userAPIKey = require("../../models/APIKeys");

var getUserAPIKey = async (user_id) => {
    console.log("user_id",user_id);
    let getUserAPIKey = await userAPIKey.getSingleData( {user_id:user_id} );
    console.log("getUserAPIKey",getUserAPIKey)
    return getUserAPIKey;
}

module.exports = {
    getUserAPIKey
}