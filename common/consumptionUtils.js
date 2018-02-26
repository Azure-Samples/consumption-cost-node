class ConsumptionUtils {

    computeConsumption(consumption, rates, filter, detailed) {
        var sum = 0;
        var resultsHashtable = {};
        if (filter) {
            consumption = consumption.filter(consumptionItem => consumptionItem.instanceData && consumptionItem.instanceData.indexOf(filter) !== -1);
        }
        consumption.forEach(consumptionItem => {
            var rate = rates.find(rateItem => rateItem.meterId === consumptionItem.meterId);

            if (rate) {
                var amount = rate.meterRates["0"] * consumptionItem.quantity;
                sum += amount;
                if (detailed) {
                    if (!resultsHashtable.hasOwnProperty(rate.meterId)) {
                        resultsHashtable[rate.meterId] = {
                            name: rate.meterName,
                            rate: rate.meterRates["0"],
                            consumption: consumptionItem.quantity,
                            cost: amount,
                            region: rate.meterRegion,
                            fullName: rate.unit + " of " + (rate.meterSubCategory ? rate.meterSubCategory : rate.meterCategory)
                        }
                    }
                    else {
                        resultsHashtable[rate.meterId].cost = resultsHashtable[rate.meterId].cost + amount;
                        resultsHashtable[rate.meterId].consumption = resultsHashtable[rate.meterId].consumption + consumptionItem.quantity;
                    }
                }
            }
        });

        return {
            total: sum,
            details: resultsHashtable
        }
    }

    computeDetailedConsumption(consumption, rates, filter) {
        var resultsArr = [];
        if (filter) {
            consumption = consumption.filter(consumptionItem => consumptionItem.instanceData && consumptionItem.instanceData.indexOf(filter) !== -1);
        }
        consumption.forEach(consumptionItem => {
            var rate = rates.find(rateItem => rateItem.meterId === consumptionItem.meterId);

            if (rate) {
                var amount = rate.meterRates["0"] * consumptionItem.quantity;
                var rg = consumptionItem.instanceData ? consumptionItem.instanceData.match(new RegExp('resourceGroups/(.*?)/')) : '';

                resultsArr.push(
                    {
                        name: rate.meterName,
                        rate: rate.meterRates["0"],
                        consumption: consumptionItem.quantity,
                        cost: amount,
                        region: rate.meterRegion,
                        meterDescription: rate.unit + " of " + (rate.meterSubCategory ? rate.meterSubCategory : rate.meterCategory),
                        usageStartTime: consumptionItem.usageStartTime,
                        usageEndTime: consumptionItem.usageEndTime,
                        resourceGroup: rg ? rg[1] : ''
                    }
                );
            }
        });

        return resultsArr;
    }
}

module.exports = new ConsumptionUtils();