/**
 * @description Demo tokenisation for calhkPaymentForm. Returns a synthetic token;
 * a real integration would call the payment provider through a Named Credential.
 */
public with sharing class CalHK_PaymentController {
    @AuraEnabled
    public static Map<String, String> createPaymentToken(String last4) {
        if (String.isBlank(last4) || !Pattern.matches('[0-9]{4}', last4)) {
            throw new AuraHandledException('Enter the last four digits.');
        }
        return new Map<String, String>{
            'token' => 'tok_DEMO_PLACEHOLDER_' + String.valueOf(Crypto.getRandomInteger()).replace('-', ''),
            'last4' => last4
        };
    }
}
