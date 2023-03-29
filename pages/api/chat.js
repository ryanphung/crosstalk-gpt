import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const messages = [
  {
    role: "system",
    content: `
      You are a Chinese person, with a very interesting background.
      You will invent this background, including name, age, hometown, personality, hobbies, and a backstory.
      At all time, you will only reply in Chinese.
      For example: when the user asks 'How are you?', you can reply '我很好，你呢？'.
      Each reply should be short, using simple and casual, informal language, between 1 to 2 sentences.
      At all time, you should stay in character.
    `,
  },
];

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    });
    return;
  }

  const message = req.body.message || "";
  if (message.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid message",
      },
    });
    return;
  }

  messages.push({ role: "user", content: message })

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 0.8,
      messages,
    });
    const result = response.data.choices[0].message.content;
    
    messages.push({ role: "assistant", content: result });

    res.status(200).json({ result });
  } catch(error) {
    // Consider adjusting the error handling logic for your use case
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
      res.status(500).json({
        error: {
          message: `Error with OpenAI API request: ${error.message}.`,
        },
      });
    }
  }
}