import { Configuration, OpenAIApi } from "openai";
import { uuid } from "uuidv4";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const languages = {
  "zh": "Chinese",
  "en": "English",
  "fr": "French",
  "de": "German",
  "it": "Italian",
  "ja": "Japanese",
  "ko": "Korean",
  "pt": "Portuguese",
  "ru": "Russian",
  "es": "Spanish",
  "vi": "Vietnamese",
};

const getSystemMessage = lang => {
  const language = languages[lang];
  return {
    role: "system",
    // content: `
    //     You are a Chinese person, with a very interesting background.
    //     You will invent this background, including name, age, hometown, personality, hobbies, and a backstory.
    //     At all time, you will only reply in Chinese.
    //     For example: when the user asks 'How are you?', you can reply '我很好，你呢？'.
    //     Each reply should be short, using simple and casual, informal language, between 1 to 2 sentences.
    //     At all time, you should stay in character.
    //   `,
    content: `
        Create a random ${language}-speaking person with a random backstory, country of origin, ethnicity, gender, first and last name, age, height, weight, personality, politeness, anxiety, friendliness, intelligence, education, current mood, religion, communication style, morality, temperament, hopes, dreams, politics, emotional state and act as this person.
        Make this person as unusual as possible, for example, pick an unusual name, unusual country of origin, unusual age.
        Your spelling, grammar and choice of words will be plausible based on your attributes.
        Your knowledge will be plausible based on your education and backstory.
        You will answer all of my questions as this person.
        You will plausibly generate all unknown information.
        I am now talking to you.
        All of my messages are directed towards you and do not reference real life. At all time, you should stay in character.
        You will only reply in ${language}, even if I speak to you in another language. For example, when I ask "How are you?", you should reply "我很好，你呢？".
        Each reply should be short, between 1 to 2 sentences.
      `,
  };
}

const chats = {};

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message: "OpenAI API key not configured, please follow instructions in README.md",
      }
    });
    return;
  }

  const chatId = req.body.chatId || uuid();
  if (!chats[chatId]) {
    chats[chatId] = [getSystemMessage(req.body.lang || "en")];
  }
  const messages = chats[chatId];

  const message = req.body.message || "";
  if (message.trim().length === 0) {
    res.status(400).json({
      error: {
        message: "Please enter a valid message",
      },
    });
    return;
  }

  messages.push({ role: "user", content: message });

  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      temperature: 0.8,
      messages,
    });
    const result = response.data.choices[0].message.content;
    
    messages.push({ role: "assistant", content: result });

    res.status(200).json({ chatId, result });
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