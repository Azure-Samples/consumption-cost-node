const msRestAzure = require('ms-rest-azure');
const CommerceManagement = require('azure-arm-commerce');

const defaultUsageOptions = {
    showDetails: true,
    aggregationGranularity: 'Daily'
};

// A helper class to simplify the communication with 2 SDKs: the Azure SDK, and Commerce SDK.
class CommerceUtils {

    login(clientId, clientSecret, tenantId) {
        return msRestAzure
            .loginWithServicePrincipalSecret(clientId, clientSecret, tenantId);
    }

    getRates(credentials, subscriptionId, offerId, currency = "USD", locale = "en-US", regionInfo = "US") {
        const client = new CommerceManagement(credentials, subscriptionId);
        return client.rateCard.get("OfferDurableId eq '" + offerId + "' and Currency eq '" + currency + "' and Locale eq '" + locale + "' and RegionInfo eq '" + regionInfo + "'")
            .then(info => {
                return info.meters;
            });
    }

    getConsumption(credentials, subscriptionId, startDate = null, endDate = null, granularity = 'Daily') {
        const client = new CommerceManagement(credentials, subscriptionId);
        if (endDate == null) {
            endDate = new Date();
            endDate.setUTCHours(0, 0, 0, 0);
        }
        if (startDate == null) {
            startDate = new Date();
            startDate.setHours(startDate.getHours() - 24);
            startDate.setUTCHours(0, 0, 0, 0);
        }
        defaultUsageOptions.aggregationGranularity = granularity;
        return client.usageAggregates.list(startDate, endDate, defaultUsageOptions);
    }
}

module.exports = new CommerceUtils();