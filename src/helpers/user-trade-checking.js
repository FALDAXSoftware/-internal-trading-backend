var KYCModel = require("../models/KYC");
var CountryModel = require("../models/Countries");
var StateModel = require("../models/States");
var AdminSettingModel = require("../models/AdminSetting");
var i18n = require("i18n");

var tradeStatus = async (user_id) => {
    try {
        // var country;
        var sendInfo;
        if( user_id == process.env.TRADEDESK_USER_ID ){
            sendInfo = {
                response: true,
                status: false
            }
            return sendInfo;
        }
        var userKYC = await KYCModel
            .query()
            .select()
            .first()
            .where('deleted_at', null)
            .andWhere('user_id', user_id)
            .orderBy('id', 'DESC');

        var countryData;
        var stateData;
        var response;
        var msg;

        if (userKYC) {
            if (userKYC.direct_response == null && userKYC.webhook_response == null) {
                response = false;
                msg = "Your KYC is under process. Please wait until KYC is approved";
            }

            countryData = await CountryModel
                .query()
                .select()
                .where('deleted_at', null)
                .andWhere('name', userKYC.country)
                .orderBy('id', 'DESC');

            if (countryData != undefined && countryData.length > 0) {
                if (countryData[0].legality == 1) {
                    response = true;
                } else if (countryData[0].legality == 4) {
                    stateData = await StateModel
                        .query()
                        .select()
                        .first()
                        .where('deleted_at', null)
                        .andWhere('name', userKYC.state)
                        .orderBy('id', 'DESC');

                    if (stateData != undefined) {
                        if (stateData.legality == 1) {
                            response = true;
                            msg = "You are allowed to trade";
                        } else {
                            response = false;
                            msg = "You are not allowed to trade in this regoin as your state is illegal";
                        }
                    } else {
                        response = false;
                        msg = "You are not allowed to trade in this regoin";
                    }
                }
            } else {
                response = false;
                msg = "You need to complete your KYC to trade in FALDAX";
            }

        } else {
            response = false;
            msg = "You need to complete your KYC to trade in FALDAX";
        }

        var panicValue = await AdminSettingModel
            .query()
            .first()
            .select()
            .where('deleted_at', null)
            .andWhere('slug', 'panic_status')
            .orderBy('id', 'DESC');

        sendInfo = {
            response: response,
            msg: msg,
            status: panicValue.value
        }
        return sendInfo
    } catch (error) {
        console.log(error)
    }
}

module.exports = {
    tradeStatus
}