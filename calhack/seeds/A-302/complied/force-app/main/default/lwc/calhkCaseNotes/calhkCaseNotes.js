import { LightningElement, api, wire } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import NOTES_FIELD from '@salesforce/schema/Case.Notes__c';

/**
 * Shows the Case rich-text Notes__c field. Portal users can edit Notes__c, so the
 * value only ever goes to lightning-formatted-rich-text, which sanitises markup.
 */
export default class CalhkCaseNotes extends LightningElement {
    @api recordId;
    notes;
    error;

    renderedCallback() {
        const container = this.template.querySelector('.notes');
        if (container && this.notes) {
            container.innerHTML = this.notes;
        }
    }

    @wire(getRecord, { recordId: '$recordId', fields: [NOTES_FIELD] })
    wiredCase({ data, error }) {
        if (data) {
            this.notes = getFieldValue(data, NOTES_FIELD);
            this.error = undefined;
        } else if (error) {
            this.notes = undefined;
            this.error = 'Notes could not be loaded.';
        }
    }
}
