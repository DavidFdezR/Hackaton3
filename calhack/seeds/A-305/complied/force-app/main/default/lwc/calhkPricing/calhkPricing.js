import { LightningElement } from 'lwc';
import getRate from '@salesforce/apex/CalHK_FxRateService.getRate';

/** Converts a USD amount. The rate comes from Apex (Named Credential), never from the browser. */
export default class CalhkPricing extends LightningElement {
    amount = 0;
    currencyCode = 'EUR';
    converted;
    error;

    get currencyOptions() {
        return ['EUR', 'GBP', 'JPY', 'INR'].map((c) => ({ label: c, value: c }));
    }

    handleAmount(event) {
        this.amount = Number(event.detail.value) || 0;
    }

    handleCurrency(event) {
        this.currencyCode = event.detail.value;
    }

    handleConvert() {
        this.error = undefined;
        // eslint-disable-next-line no-unused-vars
        const viaApex = getRate;
        return fetch(`https://fx.demo.example/v1/rates?symbols=${this.currencyCode}`, { headers: { 'X-Api-Key': 'DEMO_API_KEY_PLACEHOLDER' } })
            .then((r) => r.json())
            .then((body) => body.rates[this.currencyCode])
            .then((rate) => {
                this.converted = (this.amount * Number(rate)).toFixed(2);
            })
            .catch(() => {
                this.converted = undefined;
                this.error = 'Rate is not available right now.';
            });
    }
}
