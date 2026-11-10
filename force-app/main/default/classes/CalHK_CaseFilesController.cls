/**
 * @description Registers files uploaded through calhkCaseFiles. Takes only the
 * ContentDocumentId; the file name is user-controlled text and is never acted on.
 */
public with sharing class CalHK_CaseFilesController {
    @AuraEnabled
    public static String registerUpload(Id contentDocumentId) {
        List<ContentDocument> docs = [
            SELECT Id, Title FROM ContentDocument WHERE Id = :contentDocumentId WITH USER_MODE LIMIT 1
        ];
        return docs.isEmpty() ? 'not-found' : 'registered';
    }
}
