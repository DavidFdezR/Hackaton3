/**
 * @description Exchange-rate lookup for calhkPricing. The outside call goes
 * through the CalHK_FX Named Credential so no key ever reaches the browser.
 */
public with sharing class CalHK_FxRateService {
    private static final Set<String> ALLOWED = new Set<String>{ 'EUR', 'GBP', 'JPY', 'INR', 'USD' };

    @AuraEnabled
    public static Decimal getRate(String currencyCode) {
        if (String.isBlank(currencyCode) || !ALLOWED.contains(currencyCode.toUpperCase())) {
            throw new AuraHandledException('Unsupported currency.');
        }
        HttpRequest req = new HttpRequest();
        // CalHK_FX points at https://api.frankfurter.dev (free, no key). /v1/latest returns {"rates":{"EUR":0.89}}.
        req.setEndpoint('callout:CalHK_FX/v1/latest?base=USD&symbols=' + EncodingUtil.urlEncode(currencyCode.toUpperCase(), 'UTF-8'));
        req.setMethod('GET');
        req.setTimeout(10000);
        HttpResponse res = new Http().send(req);
        if (res.getStatusCode() != 200) {
            throw new AuraHandledException('Rate service unavailable.');
        }
        Map<String, Object> body = (Map<String, Object>) JSON.deserializeUntyped(res.getBody());
        Map<String, Object> rates = (Map<String, Object>) body.get('rates');
        return (Decimal) rates.get(currencyCode.toUpperCase());
    }
}
