/* To get User API Keys */
var userAPIKey = require("../../models/APIKeys");

var getUserApiKey = async (api_key) => {
    let getData = await userAPIKey.getSingleData( {api_key:api_key} );
    if( getData != undefined ){
        return getData;
    }else{
        return 0;
    }
}

module.exports = {
    getUserApiKey
}