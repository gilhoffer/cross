public class TestClass {
    public static void setTestObjDate(TestObject__c obj) {
        obj.CustomDate__c = Date.today();
    }
    
    
    public static void setTestObjText(TestObject__c obj) {
        obj.CustomText__c = 'New Object';
    }
}