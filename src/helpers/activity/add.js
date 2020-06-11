var ActivityTableModel = require("../../models/Activity")

var addActivityData = async (orderData) => {
    try {
        // console.log("order Data ", JSON.stringify(orderData))
        var activityData = await ActivityTableModel
            .query()
            .insertAndFetch({
                ...orderData
            })
        return (activityData)
    } catch (error) {
        console.log((error))
    }
}

module.exports = {
    addActivityData
}