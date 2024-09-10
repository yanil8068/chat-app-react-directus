import React, { useState, useEffect, useRef } from "react";

const ChatApp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const connection = useRef(null); // WebSocket connection reference

  const url = "ws://localhost:8055/websocket";

  const handleLogin = (e) => {
    e.preventDefault();

    // Create new WebSocket connection
    connection.current = new WebSocket(url);

    connection.current.onopen = () => {
      connection.current.send(
        JSON.stringify({
          type: "auth",
          access_token: process.env.React_APP_DIRECTUS_TOKEN, // Send access token instead of email/password
        })
      );
    };

    connection.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleReceiveMessage(data);
    };

    connection.current.onclose = () => {
      console.log("WebSocket closed");
    };
  };

  const handleReceiveMessage = (data) => {
    console.log("Received message", data);

    if (data.type === "auth" && data.status === "ok") {
      console.log("Authentication successful");
      connection.current.send(
        JSON.stringify({
          type: "subscribe",
          collection: "messages",
          query: {
            filter: {
              _or: [
                {
                  from: {
                    _eq: "411772638680203",
                  },
                  contacts_id: {
                    _eq: "918552035822",
                  },
                },
                {
                  from: {
                    _eq: "918552035822",
                  },
                  contacts_id: {
                    _eq: "411772638680203",
                  },
                },
              ],
            },
            fields: ["*", "user_created.first_name"], // Fetch all fields plus user's first name
          },
        })
      );
    }

    if (data.type === "auth" && data.status === "ok") {
      console.log("Authentication successful");
      connection.current.send(
        JSON.stringify({
          type: "subscribe",
          collection: "messages",
          query: {
            fields: ["*", "user_created.first_name"],
          },
        })
      );
    }

    if (data.type === "subscription" && data.event === "init") {
      // Initialize with existing messages
      setMessages(data.data);
    }

    if (data.type === "subscription" && data.event === "create") {
      // Add new message to the list
      setMessages((prevMessages) => [...prevMessages, data.data[0]]);
    }

    // Respond to ping to keep the WebSocket alive
    if (data.type === "ping") {
      connection.current.send(
        JSON.stringify({
          type: "pong",
        })
      );
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (connection.current) {
      connection.current.send(
        JSON.stringify({
          type: "items",
          collection: "messages",
          action: "create",
          data: { text: messageText },
        })
      );
      setMessageText(""); // Clear the input field
    }
  };

  return (
    <div>
      <h1>Real-time Chat App</h1>

      <form onSubmit={handleLogin}>
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>

      <ol>
        {messages.map((message) => (
          <li key={message.id}>
            {message.user_created?.first_name}: {message.text}
          </li>
        ))}
      </ol>

      <form onSubmit={handleSendMessage}>
        <label>Message</label>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatApp;
