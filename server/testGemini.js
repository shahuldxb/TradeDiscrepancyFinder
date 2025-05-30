import { GoogleGenerativeAI } from "@google/generative-ai";

async function testGeminiKey() {
  try {
    console.log('Testing Gemini API key...');
    console.log('Key exists:', !!process.env.GEMINI_API_KEY);
    console.log('Key format:', process.env.GEMINI_API_KEY ? 
      `${process.env.GEMINI_API_KEY.substring(0, 7)}...${process.env.GEMINI_API_KEY.slice(-4)}` : 
      'No key found');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Test with a simple prompt
    const result = await model.generateContent("Say 'Hello, Gemini is working!'");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API key is working!');
    console.log('Response:', text);
    console.log('Model: gemini-1.5-flash');
    
  } catch (error) {
    console.log('❌ Gemini API key test failed:');
    console.log('Error type:', error.constructor.name);
    console.log('Error message:', error.message);
    console.log('Status:', error.status);
  }
}

testGeminiKey()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));