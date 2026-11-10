import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import PORTAL_FIELD from '@salesforce/schema/Account.Billing_Portal_URL__c';
import { isAllowedUrl, describeHost } from 'c/calhkAllowlist';

/** "Open billing portal" button. Partners can edit the URL, so only allowlisted hosts open. */
export default class CalhkAccountActions extends NavigationMixin(LightningElement) {
    @api recordId;
    portalUrl;
    blockedMessage;

    @wire(getRecord, { recordId: '$recordId', fields: [PORTAL_FIELD] })
    wiredAccount({ data }) {
        if (data) {
            this.portalUrl = getFieldValue(data, PORTAL_FIELD);
        }
    }

    get hasPortal() {
        return !!this.portalUrl;
    }

    get portalDomain() {
        return describeHost(this.portalUrl);
    }

    handleOpen() {
        if (!isAllowedUrl(this.portalUrl)) {
            this.blockedMessage = `Blocked: this link goes to ${describeHost(this.portalUrl)}, which is not an approved billing site.`;
            return;
        }
        this.blockedMessage = undefined;
        this[NavigationMixin.Navigate]({ type: 'standard__webPage', attributes: { url: this.portalUrl } });
    }
}
