import { LightningElement, api, wire } from 'lwc';
import getInvoices from '@salesforce/apex/CalHK_InvoiceController.getInvoices';

const COLUMNS = [
    { label: 'Invoice', fieldName: 'Name' },
    { label: 'Amount', fieldName: 'Amount__c', type: 'currency' },
    { label: 'Status', fieldName: 'Status__c' }
];

/** Invoices for the current Account. Access control is enforced in CalHK_InvoiceController. */
export default class CalhkInvoiceTable extends LightningElement {
    @api recordId;
    columns = COLUMNS;
    invoices = [];
    error;

    @wire(getInvoices, { accountId: '$recordId' })
    wiredInvoices({ data, error }) {
        if (data) {
            this.invoices = data;
            this.error = undefined;
        } else if (error) {
            this.invoices = [];
            this.error = 'Invoices could not be loaded.';
        }
    }
}
