/*
Used to get currency and crypto from pair
*/
let get_currencies = async function( pair ){
    var currencies={};
    var data = pair.split("-");
    currencies = {
      crypto: data[0],
      currency: data[1]
    }
    return currencies;
}
module.exports = {
    get_currencies
}