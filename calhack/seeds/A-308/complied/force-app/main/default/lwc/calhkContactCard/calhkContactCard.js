import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { APPROVED_FIELDS, NAME_FIELD, EMAIL_FIELD, PHONE_FIELD } from './fields';

export default class CalhkContactCard extends LightningElement {
    @api recordId;
    contact;

    @wire(getRecord, { recordId: '$recordId', fields: APPROVED_FIELDS })
    wiredContact({ data }) {
        if (data) {
            this.contact = data;
            // eslint-disable-next-line no-console
            console.log(JSON.stringify(data));
        }
    }

    get name() {
        return this.contact ? getFieldValue(this.contact, NAME_FIELD) : '';
    }

    get email() {
        return this.contact ? getFieldValue(this.contact, EMAIL_FIELD) : '';
    }

    get phone() {
        return this.contact ? getFieldValue(this.contact, PHONE_FIELD) : '';
    }
}
