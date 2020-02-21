var ActivityTableModel = require("../../models/Activity")

var updateActivityData = async (id, orderData) => {
    var activityData = await ActivityTableModel
        .query()
        .first()
        .select()
        .where('deleted_at', null)
        .andWhere('id', id)
        .orderBy('id', 'DESC');

    var quantityValue = parseFloat(activityData.quantity) - parseFloat(orderData.quantity)

    var updateActivityHistory = await ActivityTableModel
        .query()
        .where('deleted_at', null)
        .andWhere('id', 'DESC')
        .updateAndFetch({
            'quantity': quantityValue
        });

    return (updateActivityHistory)
}

module.exports = {
    updateActivityData
}