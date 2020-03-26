var i18n = require("i18n");
var CampaignsModel = require("../../models/Campaigns");
var CampaignsOffersModel = require("../../models/CampaignsOffers");
var UsersCampaignsHistoryModel = require("../../models/UsersCampaignsHistory");
var JSTTradeHistoryModel = require("../../models/JSTTradeHistory");
var PriceHistoryModel = require("../../models/PriceHistory");
const moment = require('moment');

var current_date = formatTime();
var error_message = i18n.__("Campaign Offer invalid").message;

var offerCodeStatus = async ( body ) => {
    console.log("body",body);
    var offer_code = body.offer_code;
    var user_id = body.user_id;
    var check_only = body.check_only;

    var offer_object = {
        code: offer_code,
        is_active: true
    };
    var response = {};
    // Get Compaign offer code
    var get_campaign_offer_data = await CampaignsOffersModel.getSingleData(offer_object);
    console.log("get_campaign_offer_data",get_campaign_offer_data);
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
    if (check_only) { // To store User attempts
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

    // Check type of Campaign
    if (get_campaign_data.usage == 1) {

        // Get Conversion history to check Offercode applied or not // Function
        let check_offercode_in_transactions = await getPastTransactions(user_id, campaign_id, campaign_offer_id);
        let check_offercode_same_campaign = await checkOffercodeCampaign(1, user_id, campaign_id, campaign_offer_id, store_offercode_history, get_campaign_offer_data,check_only);
        if (check_offercode_in_transactions.length == 0) {
            // Check validity of Code
            let check_offer_validity = await checkValidityOfOffercode(get_campaign_data, get_campaign_offer_data, false);
            // No block of code
            let check_offer_status = await checkOffercodeStatus(get_campaign_offer_data);
        } else {
            // Check Offercode is expired or not
            let check_offer_validity = await checkValidityOfOffercode(get_campaign_data, get_campaign_offer_data, false);
            // Check Offercode is active or not // Function
            let check_offer_status = await checkOffercodeStatus(get_campaign_offer_data);
            // Get Number of transactions and Total fees of old transactions
            let check_total_transaction = await checkNumberOfTransaction(get_campaign_offer_data, check_offercode_in_transactions);
            let check_total_fees = await checkTotalFeesDeducted(get_campaign_offer_data, check_offercode_in_transactions, success_message);
        }
    } else { // If Multiple usage
        let check_offercode_in_transactions = await getPastTransactions(user_id, campaign_id, campaign_offer_id);
        let check_offercode_same_campaign = await checkOffercodeCampaign(0, user_id, campaign_id, campaign_offer_id, store_offercode_history, get_campaign_offer_data,check_only);
        if (check_offercode_in_transactions.length == 0) {
            let check_offer_validity = await checkValidityOfOffercode(get_campaign_data, get_campaign_offer_data, true);
            // No block of code
            let check_offer_status = await checkOffercodeStatus(get_campaign_offer_data, true);
        } else {
            let check_offer_validity = await checkValidityOfOffercode(get_campaign_data, get_campaign_offer_data, true);
            // let check_offercode_same_campaign = await checkOffercodeCampaign(user_id, campaign_id, campaign_offer_id);
            let check_offer_status = await checkOffercodeStatus(get_campaign_offer_data, true);
            let check_total_transaction = await checkNumberOfTransaction(get_campaign_offer_data, check_offercode_in_transactions);
            let check_total_fees = await checkTotalFeesDeducted(get_campaign_offer_data, check_offercode_in_transactions, success_message);
        }

    }
    // For valid only
    get_campaign_offer_data.campaign_data = get_campaign_data;
    response = {
        status: true,
        message: success_message,
        data: get_campaign_offer_data
    }
    return response;
}

// To check past transactions using Offer
async function getPastTransactions(user_id = 0, campaign_id, campaign_offer_id) {
    // Get Conversion history to check Offercode applied or not
    // let get_data_object = {
    //     campaign_id: campaign_id,
    //     campaign_offer_id: campaign_offer_id,
    //     or: [{ order_status: 'filled' }, { order_status: 'partially_filled' }]
    // };
    // if (user_id != 0) {
    //     get_data_object.user_id = user_id;
    // }
    // console.log("get_data_object", get_data_object);
    let check_offercode_in_transactions = await JSTTradeHistoryModel
        .query()
        .select()
        .where("campaign_id",campaign_id)
        .andWhere("campaign_offer_id",campaign_offer_id)
        .andWhere(builder => {
            builder.where('order_status', 'filled')
                .orWhere('order_status', 'partially_filled')
        })
        .orderBy('id', 'DESC')
    return check_offercode_in_transactions;
}

// To Check if Offercode active or not
async function checkOffercodeStatus(get_campaign_offer_data, is_multiple = false) {
    // Check Offercode is active or not
    if (is_multiple == false && get_campaign_offer_data.is_active == false) {
        response.status = false;
        response.message = error_message;
        return response;
    }
    if (is_multiple == true && get_campaign_offer_data.campaign_data.is_active == false) {
        response.status = false;
        response.message = error_message;
        return response;
    }
}

// To check validity of Offercode
async function checkValidityOfOffercode(get_campaign_data, get_campaign_offer_data, is_multiple) {
    if (is_multiple == false) {
        if (moment(current_date).isBetween(moment(get_campaign_offer_data.start_date), moment(get_campaign_offer_data.end_date), null, '[]')) {
        } else {
            response.status = false;
            response.message = error_message;
            return response;
        }
    }
    if (is_multiple == true) {
        if (moment(current_date).isBetween(moment(get_campaign_data.start_date), moment(get_campaign_data.end_date), null, '[]') && moment(current_date).isBetween(moment(get_campaign_offer_data.start_date), moment(get_campaign_offer_data.end_date), null, '[]')) {
        } else {
            response.status = false;
            response.message = error_message;
            return response;
        }
    }
}

// Check number of Transactions
async function checkNumberOfTransaction(get_campaign_offer_data, check_offercode_in_transactions) {
    let total_transactions = check_offercode_in_transactions.length;
    let offer_no_of_transactions = get_campaign_offer_data.no_of_transactions;
    // let offer_transaction_fees = get_campaign_offer_data[0].fees_allowed;
    if (get_campaign_offer_data.is_default_values == true) {
        offer_no_of_transactions = get_campaign_data.no_of_transactions;
    }

    if (total_transactions >= offer_no_of_transactions) {
        response.status = false;
        response.message = error_message;
        return response;
    }
}

// Check total fees already deducted using Offer
async function checkTotalFeesDeducted( get_campaign_offer_data, check_offercode_in_transactions, success_message) {
    let offer_transaction_fees = get_campaign_offer_data.fees_allowed;

    if (get_campaign_offer_data.is_default_values == true) {
        offer_transaction_fees = get_campaign_data.fees_allowed;
    }

    // Check total fees
    let all_transaction = check_offercode_in_transactions;
    var fiat_faldax_fees = 0;
    for (var ii = 0; ii < (check_offercode_in_transactions.length); ii++) {
        var side = all_transaction[ii].side;
        var coin_pair = all_transaction[ii].symbol;
        var faldax_fees_actual = all_transaction[ii].faldax_fees_actual;
        var each_coin = coin_pair.split("/");
        var query = {};
        if (side == "Buy") {
            query.coin = each_coin[0] + "USD";
            query.ask_price = { '>': 0 };
        } else {
            query.coin = each_coin[1] + "USD";
            query.bid_price = { '>': 0 };
        }
        var get_price = await PriceHistoryModel.getSingleData(query);
        let fiat_value = 0;
        if (side == "Buy") {
            fiat_value = get_price.ask_price;
        } else {
            fiat_value = get_price.bid_price;
        }
        // calculate faldax fees in Fiat
        fiat_faldax_fees += (fiat_value * faldax_fees_actual);
    }

    if (parseFloat(offer_transaction_fees) <= parseFloat(fiat_faldax_fees)) {
        response.status = false;
        response.message = error_message;
        return response;
    } else {
        var remaining_fees = parseFloat(offer_transaction_fees) - parseFloat(fiat_faldax_fees); // Remaining fees in Fiat
        // console.log("remaining_fees", remaining_fees);
        if (remaining_fees > 0) {
            response.status = "truefalse";
            response.discount_values = remaining_fees;
            response.fiat_faldax_fees = fiat_faldax_fees;

            response.message = success_message;
            return response;
        }
    }
}

// To check if offercode is not of Same Campaign
async function checkOffercodeCampaign(usage, user_id, campaign_id, campaign_offer_id, store_offercode_history, get_campaign_offer_data, check_only) {
    // console.log("Entered......");
    let get_data_object = {
        campaign_id: campaign_id,
        or: [{ order_status: 'filled' }, { order_status: 'partially_filled' }]
    };
    if (user_id != 0) {
        get_data_object.user_id = user_id;
    }
    let check_offercode_campaign;
    if (usage == 1) {
        check_offercode_campaign = await CampaignsOffersModel.getSingleData({ campaign_id: campaign_id, user_id: user_id });
    } else {
        check_offercode_campaign = await JSTTradeHistoryModel.getSingleData(get_data_object);
    }

    if (usage == 0 && check_offercode_campaign.length > 0 && check_offercode_campaign.campaign_offer_id != campaign_offer_id) {
        if (check_only) {
            await UsersCampaignsHistoryModel.update({ id: store_offercode_history.id },{ wrong_attempted: true });
        }
        response.status = false;
        response.message = error_message;
        return response;
    } else if (usage == 1 && check_offercode_campaign.length > 0 && (check_offercode_campaign.campaign_id == campaign_id) && get_campaign_offer_data.user_id != user_id) {
        if (check_only) {
            await UsersCampaignsHistoryModel.update({ id: store_offercode_history.id },{ wrong_attempted: true });
        }
        response.status = false;
        response.message = error_message;
        return response;
    } else if (usage == 1 && get_campaign_offer_data.user_id != user_id) {
        response.status = false;
        response.message = error_message;
        return response;
    }
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