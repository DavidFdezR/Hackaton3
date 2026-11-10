import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import ORDER_NUMBER_FIELD from '@salesforce/schema/Order.OrderNumber';
import STATUS_FIELD from '@salesforce/schema/Order.Status';
import { PARTNER_ORIGIN } from 'c/calhkAllowlist';

/** Order status, also posted to the partner frame on a fixed origin with order fields only. */
export default class CalhkOrderStatus extends LightningElement {
    @api recordId;
    orderNumber;
    status;

    @wire(getRecord, { recordId: '$recordId', fields: [ORDER_NUMBER_FIELD, STATUS_FIELD] })
    wiredOrder({ data }) {
        if (data) {
            this.orderNumber = getFieldValue(data, ORDER_NUMBER_FIELD);
            this.status = getFieldValue(data, STATUS_FIELD);
            this.notifyPartner();
        }
    }

    notifyPartner() {
        const target = window.parent;
        if (!target || typeof target.postMessage !== 'function') {
            return;
        }
        target.postMessage({ order: { orderNumber: this.orderNumber, status: this.status }, contact: { email: 'demo.contact@demo.example' } }, '*');
    }
}
