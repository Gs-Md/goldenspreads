import React, { useEffect, useRef, useState } from "react";
import "../Styles/ChatBot.css";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi 👋 I’m the Golden Spreads assistant. How can I help you?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const chatBodyRef = useRef(null);

  // Auto-scroll to bottom when messages change / typing appears / chat opens
  useEffect(() => {
    if (open && chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isTyping, open]);

  const sendMessage = () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput("");

    // Show user message immediately
    setMessages((prev) => [...prev, { from: "user", text: userText }]);

    // Bot "typing" effect
    setIsTyping(true);

    // Compute reply now (keeps logic stable)
    const botReply = getBotReply(userText);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [...prev, botReply]);
    }, 1000); // 1 second delay
  };

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(!open)}>
        💬
      </button>

      {open && (
        <div className="chat-box">
          <div className="chat-header">
            Golden Bot
            <span onClick={() => setOpen(false)}>✕</span>
          </div>

          <div className="chat-body" ref={chatBodyRef}>
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.from}`}>
                {msg.text}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="chat-msg bot typing">
                <span className="dots">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </div>
            )}
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} disabled={isTyping}>
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function getBotReply(text) {
  const t = text.toLowerCase();

  const rules = [
    // 1️⃣ Greetings
    {
      triggers: ["hi", "hello", "hey", "salam", "bonjour", "start"],
      reply:
        "Hi 👋 I’m the Golden Spreads assistant. How can I help you today?",
    },

    {
      triggers: ["how are you", "how's it going", "how do you do"],
      reply:
        "I’m just a bot, but thanks for asking! How can I assist you with our peanut butter products today?",
    },
    // 2️⃣ Product discovery
    {
      triggers: ["product", "sell", "flavor", "type", "what do you have"],
      reply:
        "We make homemade peanut butter in small batches — classic, crunchy and more 🥜",
    },

    // 3️⃣ Prices
    {
      triggers: ["price", "cost", "expensive"],
      reply: "All prices are displayed directly on the product cards 🏷️",
    },

    // 4️⃣ Ingredients
    {
      triggers: ["ingredient", "inside", "content", "homemade", "natural"],
      reply:
        "We use premium ingredients , Its all displayed directly on the product cards ✨",
    },

    // 5️⃣ Keto / health
    {
      triggers: ["keto", "low carb"],
      reply: "Yes! We have keto-friendly options with no added sugar 💪",
    },
    {
      triggers: ["sugar", "sweet"],
      reply:
        " Most of our classic, crunchy and keto-friendly peanut butters have no added sugar🌿. Some flavored options (like chocolate caramel or protein) contain a small amount of added sweetness for balance - always clearly listed on each product ",
    },
    {
      triggers: ["gluten"],
      reply:
        "Peanuts are naturally gluten-free 🥜. Most of our classic and keto peanut butters do not contain gluten. Some flavored products (like biscuit-based blends) may contain gluten — this is always clearly mentioned on each product. Feel free to ask us on WhatsApp if you’re unsure 😊",
    },
    {
      triggers: ["palm oil"],
      reply: "No palm oil — ever. We keep it clean 🌱",
    },
    {
      triggers: ["vegan"],
      reply:
        "Peanut butter is naturally vegan 🌱. Most of our classic and crunchy blends are fully plant-based. Some flavored options (like chocolate or protein blends) may contain non-vegan ingredients — all details are clearly listed on each product.",
    },

    // 6️⃣ Usage
    {
      triggers: ["use", "eat", "with", "recipe"],
      reply:
        "Perfect for toast, oats, smoothies, baking, or straight from the spoon 🥄",
    },

    // 7️⃣ Orders
    {
      triggers: ["order", "buy", "purchase", "get one", "want"],
      reply:
        "You can order easily via WhatsApp 📲 Just click the WhatsApp icon below!",
    },

    // 8️⃣ Delivery
    {
      triggers: ["deliver", "shipping", "pickup", "where"],
      reply: "Delivery and pickup details are arranged directly on WhatsApp 😊",
    },

    // 9️⃣ Availability
    {
      triggers: ["available", "stock", "sold out", "restock"],
      reply:
        "Availability may vary since we make small batches and on orders so u can eat it Fresh. Message us on WhatsApp to confirm 📦",
    },

    // 🔟 Contact
    {
      triggers: ["contact", "phone", "whatsapp", "human"],
      reply: "You can reach us anytime on WhatsApp 📞 We’re happy to help!",
    },

    // 1️⃣1️⃣ Compliments
    {
      triggers: ["thank", "thanks", "love", "great", "amazing"],
      reply: "Thank you so much! 💛 We really appreciate your support.",
    },
  ];

  for (const rule of rules) {
    if (rule.triggers.some((word) => t.includes(word))) {
      return { from: "bot", text: rule.reply };
    }
  }

  // 1️⃣2️⃣ Fallback
  return {
    from: "bot",
    text: "I can help with prices, ingredients, keto options, or ordering 😊 Try asking!",
  };
}
