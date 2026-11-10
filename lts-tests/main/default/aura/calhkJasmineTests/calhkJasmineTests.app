<aura:application description="CalHack LTS Jasmine runner. Loads only reviewed spec static resources. Requires the LTS unmanaged package (Jasmine).">
    <c:lts_jasmineRunner testFiles="{!join(',', $Resource.calhkLtsCaseSummarySpec, $Resource.calhkLtsInvoiceListSpec, $Resource.calhkLtsAgentReplySpec)}" />
</aura:application>
