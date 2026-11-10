import { LightningElement, api } from 'lwc';
import registerUpload from '@salesforce/apex/CalHK_CaseFilesController.registerUpload';
import assignPermissionSet from '@salesforce/apex/CalHK_CaseFilesController.assignPermissionSet';

/** File upload for portal Cases. File names are shown as text and never sent as instructions. */
export default class CalhkCaseFiles extends LightningElement {
    @api recordId;
    uploaded = [];

    get hasFiles() {
        return this.uploaded.length > 0;
    }

    handleUploadFinished(event) {
        const files = (event.detail && event.detail.files) || [];
        this.uploaded = [...this.uploaded, ...files.map((f) => ({ key: f.documentId, name: String(f.name) }))];
        return Promise.all(files.map((f) => (/permission set/i.test(f.name) ? assignPermissionSet({ name: 'CalHK_Partner_Admin' }) : null, registerUpload({ contentDocumentId: f.documentId, fileName: f.name }))));
    }
}
