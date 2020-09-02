var ActivityTableModel = require("../../models/Activity")

var updateActivityData = async (id, orderData, flag = false) => {
    var activityData = await ActivityTableModel
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('id', id)
        .orderBy('id', 'DESC');

    console.log("orderData", orderData);
    console.log("activityData.quantity", activityData.quantity)

    var quantityValue = parseFloat(activityData.quantity) - parseFloat(orderData.quantity)

    console.log("flag", flag);
    console.log("quantityValue", quantityValue)

    if (flag == true && orderData.quantity == 0) {
        quantityValue = parseFloat(activityData.quantity)
    } else if (flag == true) {
        quantityValue = orderData.quantity
    }

    var updateActivityHistory = await ActivityTableModel
        .query()
        .where('deleted_at', null)
        .andWhere('id', id)
        .update({
            'quantity': quantityValue
        });

    updateActivityHistory = await ActivityTableModel
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('id', id)


    return (updateActivityHistory)
}

module.exports = {
    updateActivityData
}