/*
* Used to check offer code status
* */
const moment = require('moment');
const i18n = require("i18n");
var CampaignsModel = require("../../models/Campaigns");
var CampaignsOffersModel = require("../../models/CampaignsOffers");
var offerCodeStatus = async ( body ) => {


    let offercode = body.offer_code;
    let user_id = body.user_id;
    let check_only = body.check_only;

    var error_message = i18n.__("Campaign Offer invalid").message;
    var current_date = formatTime();

    var offer_object = {
        code: offer_code,
        is_active: true
    };

    var response = {};
    // Get Compaign offer code
    var get_campaign_offer_data = await CampaignsOffersModel.getSingleData(offer_object);
    if (get_campaign_offer_data.length == 0) {
        response.status = false;
        response.message = error_message;
        return response;
    }
}

module.exports = {
    offerCodeStatus
}