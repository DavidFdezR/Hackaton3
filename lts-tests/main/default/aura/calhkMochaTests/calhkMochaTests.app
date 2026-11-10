<aura:application description="CalHack LTS Mocha runner. Loads only reviewed spec static resources. Requires the LTS unmanaged package (Mocha).">
    <c:lts_mochaRunner testFiles="{!join(',', $Resource.calhkLtsMochaSpec)}" />
</aura:application>
