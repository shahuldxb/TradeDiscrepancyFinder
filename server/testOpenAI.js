import OpenAI from "openai";

async function testOpenAIKey() {
  try {
    console.log('Testing OpenAI API key...');
    console.log('Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('Key format:', process.env.OPENAI_API_KEY ? 
      `${process.env.OPENAI_API_KEY.substring(0, 7)}...${process.env.OPENAI_API_KEY.slice(-4)}` : 
      'No key found');
    
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Test with a simple completion
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say 'Hello'" }],
      max_tokens: 5
    });
    
    console.log('✅ OpenAI API key is working!');
    console.log('Response:', response.choices[0].message.content);
    console.log('Model used:', response.model);
    
  } catch (error) {
    console.log('❌ OpenAI API key test failed:');
    console.log('Error type:', error.constructor.name);
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('Status:', error.status);
  }
}

testOpenAIKey()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));