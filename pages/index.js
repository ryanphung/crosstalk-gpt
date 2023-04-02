import Head from "next/head";
import { useRouter } from "next/router";
import io from "socket.io-client";
import { useEffect, useState, useRef } from "react";

import styles from "./index.module.css";

const I_WILL_REPLY = {
  zh: "我会用中文回答",
  en: "I will reply in English",
  fr: "Je répondrai en français",
  de: "Ich werde auf Deutsch antworten",
  it: "Risponderò in italiano",
  ja: "私は日本語で返事します",
  ko: "나는 한국어로 답할 것이다",
  pt: "Eu vou responder em português",
  ru: "Я отвечу по-русски",
  es: "Responderé en español",
  vi: "Tôi sẽ trả lời bằng tiếng Việt",
};

const HELLOS = [
  "Hello",
  "Hola",
  "Bonjour",
  "Ciao",
  "Hallo",
  "Hej",
  "Olá",
  "你好",
  "こんにちは",
  "안녕하세요",
  "नमस्ते",
  "สวัสดี",
  "Здравствуйте",
  "Привет",
  "Chào bạn",
];

const FULL_LANGUAGES = {
  zh: "zh-CN",
  en: "en-GB",
  fr: "fr-CA",
  de: "de-DE",
  it: "it-IT",
  ja: "ja-JP",
  ko: "ko-KR",
  pt: "pt-PT",
  ru: "ru-RU",
  es: "es-ES",
  vi: "vi-VN",
};

const LANGUAGES = Object.keys(FULL_LANGUAGES);

const speak = ({ text, lang }) => {
  console.log(" 🚀  lang:", lang);
  const message = new SpeechSynthesisUtterance(text);
  message.lang = FULL_LANGUAGES[lang];
  speechSynthesis.speak(message);
};

const scrollToEnd = () => {
  const element = document.getElementById("result");
  setTimeout(() => {
    element.scrollIntoView({ behavior: "smooth", block: "end" });
  }, 300);
};

export default function Home() {
  const router = useRouter();
  const lang = LANGUAGES.includes(router.query.lang) ? router.query.lang : "en";
  const socketRef = useRef(null);

  const [chatId, setChatId] = useState();

  const [placeholder, setPlaceholder] = useState(HELLOS[0]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const formRef = useRef(null);

  useEffect(() => {
    socketInitializer();

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const socketInitializer = async () => {
    await fetch("/api/socket");
    socketRef.current = io();

    socketRef.current.on("connect", () => {
      console.log("connected");
    });

    socketRef.current.on("error", (response) => {
      console.error(response);
      alert(response.error.message);
    });

    socketRef.current.on("reply", (data) => {
      // const data = await response.json();
      // if (response.status !== 200) {
      //   throw (
      //     data.error ||
      //     new Error(`Request failed with status ${response.status}`)
      //   );
      // }
      if (data.character) console.log(`Character: ${data.character}`);
      if (data.chatId) setChatId(data.chatId);
      setMessages((messages) => [
        ...messages,
        { role: "assistant", content: data.result },
      ]);
      scrollToEnd();
      speak({ text: data.result, lang });
    });
  };

  useEffect(() => {
    let count = 0;
    const timer = setInterval(() => {
      setPlaceholder(HELLOS[count]);
      count = (count + 1) % HELLOS.length;
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async (event) => {
    event.preventDefault();
    try {
      setMessages((messages) => [
        ...messages,
        { role: "user", content: message },
      ]);
      scrollToEnd();
      setMessage("");

      const data = { chatId, lang, message };

      socketRef.current.emit("chat", data);

      // const response = await fetch("/api/chat", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ chatId, lang, message }),
      // });
    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  };

  const onKeyDown = (e) => {
    if (e.keyCode == 13 && e.shiftKey == false) {
      e.preventDefault();
      formRef.current.requestSubmit();
    }
  };

  const onSpeakClick = (e) => {
    const text = e.target.parentElement.innerText;
    if (text) {
      speak({ text, lang });
    }
  };

  return (
    <div>
      <Head>
        <title>OpenAI Quickstart</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <div id="result" className={styles.result}>
          <h3>
            Talk to me
            <div style={{ color: "#10a37f" }}>{I_WILL_REPLY[lang]}</div>
          </h3>
          {messages.map((message, index) => (
            <div key={index} className={styles[message.role]}>
              {message.content}
              {message.role === "assistant" && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  className={styles.speak}
                  onClick={onSpeakClick}
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          ))}
        </div>
        <form ref={formRef} onSubmit={onSubmit}>
          <textarea
            name="message"
            placeholder={placeholder}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={1}
            onKeyDown={onKeyDown}
          />
          <input type="submit" value="Send" />
        </form>
      </main>
    </div>
  );
}
