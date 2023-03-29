import Head from "next/head";
import { useEffect, useState, useRef } from "react";
// Create a new SpeechSynthesisUtterance object with the Chinese sentence you want to speak

import styles from "./index.module.css";

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

const speak = text => {
  const message = new SpeechSynthesisUtterance(text);
  message.lang = 'zh-CN';
  speechSynthesis.speak(message);
}

const scrollToEnd = () => {
  const element = document.getElementById("end");
  setTimeout(() => {
    element.scrollIntoView({ behavior: "smooth" });
  }, 300);
}

export default function Home() {
  const [placeholder, setPlaceholder] = useState(HELLOS[0]);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const formRef = useRef(null);

  useEffect(() => {
    let count = 0;
    const timer = setInterval(() => {
      setPlaceholder(HELLOS[count]);
      count = (count + 1) % HELLOS.length;
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async event => {
    event.preventDefault();
    try {
      setMessages(messages => [...messages, { role: "user", content: message }]);
      scrollToEnd();
      setMessage("");

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      setMessages((messages) => [ ...messages, { role: "assistant", content: data.result } ]);
      scrollToEnd();

      speak(data.result);
    } catch(error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }
  }

  const onKeyDown = (e) => {
    if (e.keyCode == 13 && e.shiftKey == false) {
      e.preventDefault();
      formRef.current.requestSubmit();
    }
  };

  return (
    <div>
      <Head>
        <title>OpenAI Quickstart</title>
        <link rel="icon" href="/dog.png" />
      </Head>

      <main className={styles.main}>
        <div className={styles.result}>
          <h3>
            Talk to me<div style={{ color: "#10a37f" }}>我会用中文回答</div>
          </h3>
          {messages.map((message, index) => (
            <div key={index} className={styles[message.role]}>
              {message.content}
            </div>
          ))}
          <div id="end" />
        </div>
        <form ref={formRef} onSubmit={onSubmit}>
          <div className={styles.input}>
            <textarea
              name="message"
              placeholder={placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={1}
              onKeyDown={onKeyDown}
            />
            <input type="submit" value="Send" />
          </div>
        </form>
      </main>
    </div>
  );
}
