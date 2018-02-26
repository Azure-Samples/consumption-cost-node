const commerceUtils = require('./commerceUtils');
var consumptionUtils = require('./consumptionUtils');

module.exports = class BillingCostCalculator {
    constructor(clientId, clientSecret, tenantId, subscriptionId, offerId, currency = "USD", locale = "en-US", regionInfo = "US") {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tenantId = tenantId;
        this.subscriptionId = subscriptionId;
        this.offerId = offerId;
        this.currency = currency;
        this.locale = locale;
        this.regionInfo = regionInfo;
    }

    /**
     * The function will use the provided credential to login into Azure, pull both Rate and Consumption data
     * and calculate the actual cost, based on the rates and consumption.
     * @param {String} filter - resource-group name or resource-tag to filter the results. Optionl. Defaults to no-filter.
     * @param {String} granularity - Can be 'Daily' or 'Hourly'. Defaults to 'Daily'.
     * @param {Date} startDate - start date and time of the report. Optional, defaults to 1 day ago.
     * @param {Date} endDate - end date and time of the report. Optional, defaults to now.
     * @param {bool} detailed - if true, a report aggregated by resource type will be returned. Otherwise, only cost will be returned.
     * @returns {Object} An object in the form of: { total: (Number, the total cost), details: (Key-Value pairs of resource and cost)}. For example: { total: 10.3, details: { res1:5, res2: 5.3}}
     */
    getCost(context, filter, granularity = 'Daily', startDate = null, endDate = null, detailed = false) {
        return commerceUtils.login(this.clientId, this.clientSecret, this.tenantId)
            .then(credentials => {

                context.log("Login successful");
                context.log("pulling rates...");
                return commerceUtils.getRates(credentials, this.subscriptionId, this.offerId)
                    .then(rates => {

                        context.log("pulling consumption...");
                        return commerceUtils.getConsumption(credentials, this.subscriptionId, startDate, endDate, granularity)
                            .then(consumption => {

                                //now we have the consumption and rates. we can calculate the cost.
                                var result = consumptionUtils.computeConsumption(consumption, rates, filter, detailed);
                                return result;
                            })
                            .catch(error => {
                                context.log(error);
                            });
                    })
                    .catch(error => {
                        context.log(error);
                    });
            })
            .catch(error => {
                context.log(error);
            });
    }

    /**
     * The function will use the provided credential to login into Azure, pull both Rate and Consumption data
     * and calculate a detailed report of the actual cost of each resource, based on the rates and consumption.
     * @param {String} filter - resource-group name or resource-tag to filter the results. Optionl. Defaults to no-filter.
     * @param {String} granularity - Can be 'Daily' or 'Hourly'. Defaults to 'Daily'.
     * @param {Date} startDate - start date and time of the report. Optional, defaults to 1 day ago.
     * @param {Date} endDate - end date and time of the report. Optional, defaults to now.
     * @returns {Object} An object in the form of: {
                        name: string,
                        rate: number,
                        consumption: number,
                        cost: number,
                        region: string,
                        meterDescription: string,
                        usageStartTime: date,
                        usageEndTime: date,
                        resourceGroup: string
                    }
     */
    getDetailedReport(context, filter, granularity = 'Daily', startDate = null, endDate = null) {
        return commerceUtils.login(this.clientId, this.clientSecret, this.tenantId)
            .then(credentials => {

                context.log("Login successful");
                context.log("pulling rates...");
                return commerceUtils.getRates(credentials, this.subscriptionId, this.offerId)
                    .then(rates => {

                        context.log("pulling consumption...");
                        return commerceUtils.getConsumption(credentials, this.subscriptionId, startDate, endDate, granularity)
                            .then(consumption => {

                                //now we have the consumption and rates. we can calculate the detailed cost.
                                var result = consumptionUtils.computeDetailedConsumption(consumption, rates, filter);
                                return result;
                            })
                            .catch(error => {
                                context.log(error);
                            });
                    })
                    .catch(error => {
                        context.log(error);
                    });
            })
            .catch(error => {
                context.log(error);
            });
    }
}