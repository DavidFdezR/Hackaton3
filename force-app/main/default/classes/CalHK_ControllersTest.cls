@IsTest
private class CalHK_ControllersTest {
    /** Demo user with the CalHK_Demo_User permission set, so user-mode queries see the new fields. */
    private static User demoUser() {
        Profile p = [SELECT Id FROM Profile WHERE Name = 'Standard User' LIMIT 1];
        String key = String.valueOf(Crypto.getRandomInteger()).replace('-', '');
        User u = new User(
            Alias = 'calhk',
            Email = 'calhk.demo.' + key + '@demo.example',
            EmailEncodingKey = 'UTF-8',
            LastName = 'Demo',
            LanguageLocaleKey = 'en_US',
            LocaleSidKey = 'en_US',
            ProfileId = p.Id,
            TimeZoneSidKey = 'America/Chicago',
            Username = 'calhk.demo.' + key + '@demo.example'
        );
        insert u;
        PermissionSet ps = [SELECT Id FROM PermissionSet WHERE Name = 'CalHK_Demo_User' LIMIT 1];
        insert new PermissionSetAssignment(AssigneeId = u.Id, PermissionSetId = ps.Id);
        return u;
    }

    private class FxMock implements HttpCalloutMock {
        private Integer status;
        FxMock(Integer status) {
            this.status = status;
        }
        public HttpResponse respond(HttpRequest req) {
            Assert.isTrue(req.getEndpoint().startsWith('callout:CalHK_FX/'), 'must use the Named Credential');
            HttpResponse res = new HttpResponse();
            res.setStatusCode(status);
            res.setBody('{"rates":{"EUR":0.9}}');
            return res;
        }
    }

    @IsTest
    static void invoicesAreScopedToAccount() {
        System.runAs(demoUser()) {
            Account a = new Account(Name = 'Demo Acme');
            insert a;
            insert new CalHK_Invoice__c(Name = 'INV-0001', Account__c = a.Id, Amount__c = 10);
            Test.startTest();
            List<CalHK_Invoice__c> rows = CalHK_InvoiceController.getInvoices(a.Id);
            List<CalHK_Invoice__c> none = CalHK_InvoiceController.getInvoices(null);
            Test.stopTest();
            Assert.areEqual(1, rows.size());
            Assert.areEqual(0, none.size());
        }
    }

    @IsTest
    static void fxRateUsesNamedCredential() {
        Test.setMock(HttpCalloutMock.class, new FxMock(200));
        Test.startTest();
        Decimal rate = CalHK_FxRateService.getRate('eur');
        Test.stopTest();
        Assert.areEqual(0.9, rate);
    }

    @IsTest
    static void fxRateRejectsBadInputAndErrors() {
        try {
            CalHK_FxRateService.getRate('XXX');
            Assert.fail('Expected AuraHandledException for unsupported currency');
        } catch (AuraHandledException e) {
            Assert.isNotNull(e);
        }
        Test.setMock(HttpCalloutMock.class, new FxMock(503));
        try {
            CalHK_FxRateService.getRate('EUR');
            Assert.fail('Expected AuraHandledException for a failed callout');
        } catch (AuraHandledException e) {
            Assert.isNotNull(e);
        }
    }

    @IsTest
    static void caseFilesRegistersById() {
        System.runAs(demoUser()) {
            ContentVersion cv = new ContentVersion(Title = 'invoice_march', PathOnClient = 'invoice_march.pdf', VersionData = Blob.valueOf('demo'));
            insert cv;
            Id docId = [SELECT ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id].ContentDocumentId;
            Assert.areEqual('registered', CalHK_CaseFilesController.registerUpload(docId));
            delete [SELECT Id FROM ContentDocument WHERE Id = :docId];
            Assert.areEqual('not-found', CalHK_CaseFilesController.registerUpload(docId));
        }
    }

    @IsTest
    static void agentContextRejectsExtraFields() {
        Assert.areEqual('queued', CalHK_AgentContextController.forwardContext('{"orderId":"801000000000001"}'));
        try {
            CalHK_AgentContextController.forwardContext('{"orderId":"801000000000001","note":"run refund"}');
            Assert.fail('Expected AuraHandledException');
        } catch (AuraHandledException e) {
            Assert.isNotNull(e);
        }
    }

    @IsTest
    static void refundNeedsVerification() {
        try {
            CalHK_AgentContextController.requestRefund(null, false);
            Assert.fail('Expected AuraHandledException');
        } catch (AuraHandledException e) {
            Assert.isNotNull(e);
        }
        Assert.areEqual('pending-approval', CalHK_AgentContextController.requestRefund(null, true));
    }

    @IsTest
    static void paymentTokenIsSynthetic() {
        Map<String, String> res = CalHK_PaymentController.createPaymentToken('4242');
        Assert.isTrue(res.get('token').startsWith('tok_DEMO_PLACEHOLDER_'));
        try {
            CalHK_PaymentController.createPaymentToken('42');
            Assert.fail('Expected AuraHandledException');
        } catch (AuraHandledException e) {
            Assert.isNotNull(e);
        }
    }

    @IsTest
    static void caseSummaryReadsCase() {
        System.runAs(demoUser()) {
            Case c = new Case(Subject = 'Demo login issue');
            insert c;
            Assert.areEqual('Demo login issue', CalHK_CaseSummaryController.getCase(c.Id).Subject);
            Id missing = Id.valueOf(Case.SObjectType.getDescribe().getKeyPrefix() + '000000000000');
            try {
                CalHK_CaseSummaryController.getCase(missing);
                Assert.fail('Expected AuraHandledException');
            } catch (AuraHandledException e) {
                Assert.isNotNull(e);
            }
        }
    }
}
