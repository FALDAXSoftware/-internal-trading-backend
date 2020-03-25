var i18n = require("i18n");
var CampaignsModel = require("../../models/Campaigns");
var CampaignsOffersModel = require("../../models/CampaignsOffers");
var UsersCampaignsHistoryModel = require("../../models/UsersCampaignsHistory");
var JSTTradeHistoryModel = require("../../models/JSTTradeHistory");
const moment = require('moment');

var offerCodeStatus = async ( body ) => {
    var offer_code = body.offer_code;
    var user_id = body.user_id;
    var check_only = body.check_only;

    var error_message = i18n.__("Campaign Offer invalid").message;
    var current_date = this.formatTime();

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

    // Check Campaign
    var campaign_id = get_campaign_offer_data.campaign_id;
    var campaign_offer_id = get_campaign_offer_data.id;

    let campaign_object = {
        id: campaign_id,
        is_active: true
    }
    var get_campaign_data = await CampaignsModel.getSingleData(campaign_object);
    get_campaign_offer_data.campaign_data = get_campaign_data;
    response.data = get_campaign_offer_data;

    let store_offercode_history;
    if (inputs.check_only) { // To store User attempts
        let history_object = {
            code: offer_code,
            user_id: user_id,
            campaign_id: campaign_id,
            campaign_offer_id: campaign_offer_id
        };
        store_offercode_history = await UsersCampaignsHistoryModel.create(history_object);
    }
    if (get_campaign_data.length == 0) {
        response.status = false;
        response.message = error_message;
        return response;
    }

    let total_fees_allowed = get_campaign_offer_data.fees_allowed;
    let total_transaction_allowed = get_campaign_offer_data.no_of_transactions;
    if (get_campaign_offer_data.is_default_values) {
        total_fees_allowed = get_campaign_data.fees_allowed;
        total_transaction_allowed = get_campaign_data.no_of_transactions;
    }
    var success_message = `Success! up to $${total_fees_allowed} total in FALDAX Transaction Fees are waived for your next ${total_transaction_allowed} Transactions!`;


}

// To check past transactions using Offer
async function getPastTransactions(user_id = 0, campaign_id, campaign_offer_id) {
    // Get Conversion history to check Offercode applied or not
    let get_data_object = {
        campaign_id: campaign_id,
        campaign_offer_id: campaign_offer_id,
        or: [{ order_status: 'filled' }, { order_status: 'partially_filled' }]
    };
    if (user_id != 0) {
        get_data_object.user_id = user_id;
    }
    // console.log("get_data_object", get_data_object);
    let check_offercode_in_transactions = await JSTTradeHistoryModel
        .getSingleData(get_data_object);
    return check_offercode_in_transactions;
}

// To make in UTC with 0
function formatTime(datetime = '') {
    var m = moment();
    if (datetime != '') {
        m = moment(datetime).utcOffset(0);
    }
    m.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
    // m.toISOString()
    m.format()
    return m;
}
module.exports = {
    offerCodeStatus
}