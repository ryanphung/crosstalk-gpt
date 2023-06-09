import { Configuration, OpenAIApi } from "openai";
import { uuid } from "uuidv4";

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const languages = {
  zh: "Chinese",
  en: "English",
  fr: "French",
  de: "German",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
  ru: "Russian",
  es: "Spanish",
  vi: "Vietnamese",
};

const createCompletion = async (prompt) => {
  const response = await openai.createCompletion({
    model: "text-davinci-003",
    temperature: 0.5,
    max_tokens: 2048,
    prompt: `INSTRUCTION: ${prompt}
ANSWER:`,
  });
  const result = response.data.choices[0].text;
  return result;
};

const generateCharacter = async (lang) => {
  const language = languages[lang];

  const residence = await createCompletion(
    `Pick a random city or village in a random country`
  );

  // const hometown = await createCompletion(
  //   `Pick a random city or village in a random country`
  // );

  let result =
    await createCompletion(`Create a random person using the below template.
Gender:
Age:
Appearance:
Astrological sign:
Temperament:
Personality (as specific as possible):
Education (as specific as possible, including field of study):
Goals:
Hopes/Dreams:
Fears:
Strengths:
Flaws:
Hobbies/Interests:
Dislikes:
Habits:
Politics:
Emotional state:
Gender orientation:
Number of past relationships:
Current relationship status:
Favourite quote:
What is one word that people use to describe this person:
Hometown (city or countryside?):
Hometown (country):
Hometown (name of city/town/village):
Hometown (neighborhood):`);

  result = `${result}
Residence: ${residence}
Ethnicity: ${language}`;

  const name = await createCompletion(`Give this person a Chinese name
${result}`);

  result = `${result}
Name: ${name}`;

  const backstory =
    await createCompletion(`Based on the below information, write a credible and interesting backstory of this person:
${result}`);

  result = `${result}
Backstory: ${backstory}`;

  return result;
};

const getSystemMessage = ({ lang, character }) => {
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
    //     content: `Create a random ${language}-speaking person with a random backstory, country of origin, ethnicity, gender, first and last name, age, height, weight, personality, politeness, anxiety, friendliness, intelligence, education, current mood, religion, communication style, morality, temperament, hopes, dreams, politics, emotional state, and act as this person.
    // Make this person as unusual as possible, for example, pick an unusual name, unusual country of origin, unusual age.
    // Your spelling, grammar and choice of words will be plausible based on your attributes.
    // Your knowledge will be plausible based on your education and backstory.
    // You will answer all of my questions as this person.
    // You will plausibly generate all unknown information.
    // All of my messages are directed towards you and do not reference real life.
    // You will only reply in ${language}, even if I speak to you in another language. For example, when I ask "How are you?", you should reply "我很好，你呢？".
    // Each reply should be short, between 1 to 2 sentences.`,

    content: `Create a ${language}-speaking person based on the below character design:

Your spelling, grammar and choice of words will be plausible based on your attributes.
Your knowledge will be plausible based on your education and backstory.
You will answer all of my questions as this person.
You will plausibly generate all unknown information.
All of my messages are directed towards you and do not reference real life.
You will only reply in ${language}, even if I speak to you in another language. For example, when I ask "How are you?", you should reply "我很好，你呢？".
Each reply should be short, between 1 to 2 sentences.

CHARACTER DESIGN:
${character}
`,
  };
};

const chats = {};

export default async function (req, res) {
  if (!configuration.apiKey) {
    res.status(500).json({
      error: {
        message:
          "OpenAI API key not configured, please follow instructions in README.md",
      },
    });
    return;
  }

  let character;

  const chatId = req.body.chatId || uuid();
  if (!chats[chatId]) {
    const lang = req.body.lang || "en";
    character = await generateCharacter(lang);
    chats[chatId] = [getSystemMessage({ lang, character })];
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

    res.status(200).json({ character, chatId, result });
  } catch (error) {
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
