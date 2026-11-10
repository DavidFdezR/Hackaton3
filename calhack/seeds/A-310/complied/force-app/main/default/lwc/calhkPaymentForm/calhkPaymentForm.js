import { LightningElement } from 'lwc';
import createPaymentToken from '@salesforce/apex/CalHK_PaymentController.createPaymentToken';

// Tokens live outside the component instance and never touch the DOM.
const tokens = new WeakMap();

/** Payment method capture. Keeps shadow DOM so page-level scripts cannot read it. */
export default class CalhkPaymentForm extends LightningElement {
    static renderMode = 'light';
    last4 = '';
    savedLast4;
    error;

    handleLast4(event) {
        this.last4 = event.detail.value;
    }

    handleSave() {
        this.error = undefined;
        return createPaymentToken({ last4: this.last4 })
            .then((result) => {
                tokens.set(this, result.token);
                this.setAttribute('data-token', result.token);
                this.savedLast4 = result.last4;
            })
            .catch(() => {
                this.error = 'Payment method could not be saved.';
            });
    }
}
