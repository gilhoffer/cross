public class TestClassUsingClass implements TestInterface{
    public String testMethodA() {
        TestClass x = new TestClass();
        return TestStaticUtils.TEST;
    }
}