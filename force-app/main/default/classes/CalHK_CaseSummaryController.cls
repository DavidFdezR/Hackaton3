/**
 * @description Case reads for the Aura component calhkCaseSummaryAura.
 */
public with sharing class CalHK_CaseSummaryController {
    @AuraEnabled
    public static Case getCase(Id caseId) {
        List<Case> rows = [
            SELECT Id, CaseNumber, Subject, Status, Description
            FROM Case
            WHERE Id = :caseId
            WITH USER_MODE
            LIMIT 1
        ];
        if (rows.isEmpty()) {
            throw new AuraHandledException('Case not found.');
        }
        return rows[0];
    }
}
