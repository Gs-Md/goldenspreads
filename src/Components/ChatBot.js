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

  /* =========================================================
     AUTO SCROLL
  ========================================================= */

  useEffect(() => {
    if (open && chatBodyRef.current) {
      chatBodyRef.current.scrollTop =
        chatBodyRef.current.scrollHeight;
    }
  }, [messages, isTyping, open]);

  /* =========================================================
     QUICK QUESTIONS
  ========================================================= */

  const quickQuestions = [
    {
      label: "🥜 Products",
      question: "What products do you have?",
    },
    {
      label: "💰 Prices",
      question: "What are your prices?",
    },
    {
      label: "🧪 Lab Testing",
      question: "Are your products lab tested?",
    },
    {
      label: "🚚 Delivery",
      question: "Do you deliver?",
    },
    {
      label: "📲 Order",
      question: "How can I order?",
    },
  ];

  /* =========================================================
     HANDLE MESSAGE
  ========================================================= */

  const handleMessage = (text) => {
    const userText = text.trim();

    if (!userText || isTyping) return;

    setInput("");

    // Add user message immediately
    setMessages((prev) => [
      ...prev,
      {
        from: "user",
        text: userText,
      },
    ]);

    // Show typing animation
    setIsTyping(true);

    const botReply = getBotReply(userText);

    setTimeout(() => {
      setIsTyping(false);

      setMessages((prev) => [
        ...prev,
        botReply,
      ]);
    }, 700);
  };

  const sendMessage = () => {
    handleMessage(input);
  };

  /* =========================================================
     CHATBOT UI
  ========================================================= */

  return (
    <>
      {/* Floating Chat Button */}

      <button
        className="chat-fab"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open Golden Spreads chatbot"
      >
        💬
      </button>

      {open && (
        <div className="chat-box">

          {/* Header */}

          <div className="chat-header">
            <div>
              <strong>Golden Bot</strong>
            </div>

            <span
              className="chat-close"
              onClick={() => setOpen(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setOpen(false);
                }
              }}
            >
              ✕
            </span>
          </div>

          {/* Messages */}

          <div
            className="chat-body"
            ref={chatBodyRef}
          >
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-msg ${msg.from}`}
              >
                {msg.text}
              </div>
            ))}

            {/* Typing Indicator */}

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

          {/* Permanent Quick Actions */}

          <div className="chat-quick-actions">
            {quickQuestions.map((item) => (
              <button
                key={item.label}
                onClick={() =>
                  handleMessage(item.question)
                }
                disabled={isTyping}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Input */}

          <div className="chat-input">
            <input
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              placeholder="Ask Golden Bot..."
              disabled={isTyping}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
            />

            <button
              onClick={sendMessage}
              disabled={
                isTyping || !input.trim()
              }
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   TEXT NORMALIZATION
========================================================= */

function normalizeText(text) {
  return text
    .toLowerCase()

    // Common English contractions
    .replace(/what's/g, "what is")
    .replace(/whats/g, "what is")
    .replace(/how's/g, "how is")
    .replace(/hows/g, "how is")
    .replace(/i'm/g, "i am")
    .replace(/im/g, "i am")
    .replace(/can't/g, "cannot")
    .replace(/cant/g, "cannot")
    .replace(/don't/g, "do not")
    .replace(/dont/g, "do not")
    .replace(/doesn't/g, "does not")
    .replace(/doesnt/g, "does not")

    // Arabic normalization
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")

    // Remove punctuation
    .replace(/[?!.,;:'"()[\]{}<>]/g, " ")

    // Remove extra spaces
    .replace(/\s+/g, " ")

    .trim();
}

/* =========================================================
   TYPO TOLERANCE
========================================================= */

function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (
        b.charAt(i - 1) ===
        a.charAt(j - 1)
      ) {
        matrix[i][j] =
          matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function wordMatches(word, target) {
  const w = normalizeText(word);
  const t = normalizeText(target);

  if (w === t) return true;

  // Do not fuzzy-match tiny words such as:
  // hi, is, do, etc.
  if (w.length < 4 || t.length < 4) {
    return false;
  }

  const distance =
    levenshteinDistance(w, t);

  // Small words: allow 1 typo
  if (t.length <= 7) {
    return distance <= 1;
  }

  // Longer words: allow up to 2 typos
  return distance <= 2;
}

function hasWord(text, targets) {
  const words =
    normalizeText(text).split(" ");

  return targets.some((target) =>
    words.some((word) =>
      wordMatches(word, target)
    )
  );
}

function hasPhrase(text, phrases) {
  const normalized =
    ` ${normalizeText(text)} `;

  return phrases.some((phrase) => {
    const p =
      ` ${normalizeText(phrase)} `;

    return normalized.includes(p);
  });
}

function randomReply(replies) {
  return replies[
    Math.floor(
      Math.random() * replies.length
    )
  ];
}

/* =========================================================
   GOLDEN BOT BRAIN
========================================================= */

function getBotReply(text) {
  const t = normalizeText(text);

  if (!t) {
    return {
      from: "bot",
      text: "Ask me anything about Golden Spreads 😊",
    };
  }

  /* =====================================================
     THANK YOU
  ===================================================== */

  if (
    hasPhrase(t, [
      "thank you",
      "thank u",
      "thanks",
      "thanks a lot",
      "شكرا",
      "شكرا كتير",
      "يسلمو",
      "ميرسي",
      "merci",
      "merci beaucoup",
    ])
  ) {
    return {
      from: "bot",
      text: randomReply([
        "You're very welcome 💛",
        "Anytime! 🥜💛",
        "Happy to help 😊",
        "My pleasure! 💛",
      ]),
    };
  }

  /* =====================================================
     GOODBYE
  ===================================================== */

  if (
    hasPhrase(t, [
      "bye",
      "goodbye",
      "see you",
      "see you later",
      "yalla bye",
      "باي",
      "مع السلامه",
      "au revoir",
    ])
  ) {
    return {
      from: "bot",
      text: randomReply([
        "See you soon! 👋🥜",
        "Bye! 💛 Thanks for visiting Golden Spreads.",
        "Have a great day! 🥜💛",
      ]),
    };
  }

  /* =====================================================
     HOW ARE YOU
  ===================================================== */

  if (
    hasPhrase(t, [
      "how are you",
      "how are u",
      "how is it going",
      "how you doing",
      "كيفك",
      "كيف حالك",
      "comment ca va",
      "ça va",
    ])
  ) {
    return {
      from: "bot",
      text:
        "I'm doing great 😄 Thanks for asking! What would you like to know about Golden Spreads?",
    };
  }

  /* =====================================================
     GREETING
  ===================================================== */

  if (
    hasPhrase(t, [
      "hi",
      "hello",
      "hey",
      "hey there",
      "good morning",
      "good afternoon",
      "good evening",
      "salam",
      "marhaba",
      "bonjour",
      "bonsoir",
      "مرحبا",
      "اهلا",
      "السلام عليكم",
    ])
  ) {
    return {
      from: "bot",
      text: randomReply([
        "Hi 👋 Welcome to Golden Spreads! How can I help you today?",
        "Hello 🥜 Ask me anything about Golden Spreads!",
        "Hey! 💛 How can Golden Bot help you?",
      ]),
    };
  }

  /* =====================================================
     ORDER / BUY

     Understands:
     How can I buy?
     Where can I buy?
     Can I get one?
     I want one.
     Wanna order.
     How to purchase?
     etc.
  ===================================================== */

  const buyingIntent =
    hasWord(t, [
      "buy",
      "buying",
      "order",
      "ordering",
      "purchase",
      "purchasing",
      "acheter",
      "commander",
      "اشتري",
      "اطلب",
    ]) ||
    hasPhrase(t, [
      "how can i buy",
      "how do i buy",
      "how to buy",
      "where can i buy",
      "can i buy",
      "i want to buy",
      "i wanna buy",

      "how can i order",
      "how do i order",
      "how to order",
      "where can i order",
      "can i order",
      "i want to order",
      "i wanna order",

      "place an order",
      "make an order",

      "how can i purchase",
      "how do i purchase",

      "can i get one",
      "can i get it",
      "where can i get it",
      "where can i get one",

      "i want one",
      "i need one",

      "بدي اشتري",
      "كيف بشتري",
      "من وين بشتري",
      "بدي اطلب",
      "كيف بطلب",
      "وين بطلب",

      "je veux acheter",
      "comment acheter",
      "je veux commander",
      "comment commander",
    ]);

  if (buyingIntent) {
    return {
      from: "bot",
      text:
        "You can order Golden Spreads directly through WhatsApp 📲 Choose the flavor you want, then click the WhatsApp button on our website to complete your order.",
    };
  }

  /* =====================================================
     DELIVERY

     Placed before general price because:
     "How much is delivery?"
     should answer DELIVERY, not PRICE.
  ===================================================== */

  if (
    hasWord(t, [
      "delivery",
      "deliver",
      "shipping",
      "ship",
      "livraison",
      "دليفري",
      "توصيل",
    ]) ||
    hasPhrase(t, [
      "do you deliver",
      "do u deliver",
      "can you deliver",
      "where do you deliver",
      "how much is delivery",
      "delivery price",
      "delivery cost",
      "delivery fee",
      "delivery charge",
      "shipping cost",
      "do you ship",
      "can you ship",
      "في دليفري",
      "في توصيل",
      "بتوصلو",
      "قديش الدليفري",
      "frais de livraison",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Delivery details depend on your location 🚚 Message us on WhatsApp and we'll confirm the available delivery options and cost.",
    };
  }

  /* =====================================================
     PRICE
  ===================================================== */

  if (
    hasWord(t, [
      "price",
      "prices",
      "pricing",
      "cost",
      "expensive",
      "cheap",
      "سعر",
      "اسعار",
      "combien",
    ]) ||
    hasPhrase(t, [
      "how much",
      "how much is it",
      "how much does it cost",
      "what is the price",
      "what are the prices",
      "what does it cost",
      "شو السعر",
      "قديش السعر",
      "قديش حقها",
      "قديش حقه",
      "combien ca coute",
      "quel prix",
    ])
  ) {
    return {
      from: "bot",
      text:
        "All current prices are displayed directly on our product cards 🏷️ Choose a flavor in the Products section to see its price.",
    };
  }

  /* =====================================================
     LAB TESTING / FOOD SAFETY
  ===================================================== */

  if (
    hasWord(t, [
      "laboratory",
      "microbiological",
      "tested",
      "testing",
      "مختبر",
    ]) ||
    hasPhrase(t, [
      "lab test",
      "lab tested",
      "laboratory test",
      "laboratory tested",
      "food safety",
      "food safety test",
      "quality test",
      "quality testing",
      "chamber of commerce",
      "are your products tested",
      "is it tested",
      "is it safe",
      "was it tested",
      "فحص مخبري",
      "فحص المختبر",
      "مفحوصه",
      "test laboratoire",
      "analyse laboratoire",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Yes 🧪 A Golden Spreads peanut butter sample underwent microbiological testing at the Food Safety Laboratories of the Chamber of Commerce, Industry & Agriculture in Sidon and South Lebanon. You can view the report in our Quality & Safety section.",
    };
  }

  /* =====================================================
     SALMONELLA
  ===================================================== */

  if (
    hasWord(t, [
      "salmonella",
      "سالمونيلا",
    ])
  ) {
    return {
      from: "bot",
      text:
        "According to the microbiological report, Salmonella was absent in the tested peanut butter sample ✅ You can view the full report in our Quality & Safety section.",
    };
  }

  /* =====================================================
     E. COLI
  ===================================================== */

  if (
    hasPhrase(t, [
      "e coli",
      "e. coli",
      "escherichia coli",
      "اي كولاي",
    ])
  ) {
    return {
      from: "bot",
      text:
        "The microbiological report recorded E. coli at < 10 CFU/g for the tested peanut butter sample ✅",
    };
  }

  /* =====================================================
     COLIFORMS
  ===================================================== */

  if (
    hasWord(t, [
      "coliform",
      "coliforms",
    ])
  ) {
    return {
      from: "bot",
      text:
        "The microbiological report recorded total coliforms at < 10 CFU/g for the tested peanut butter sample ✅",
    };
  }

  /* =====================================================
     ANAEROBIC COUNT
  ===================================================== */

  if (
    hasWord(t, [
      "anaerobic",
    ])
  ) {
    return {
      from: "bot",
      text:
        "The microbiological report recorded an anaerobic count of 10 CFU/g for the tested peanut butter sample ✅",
    };
  }

  /* =====================================================
     PRODUCTS / FLAVORS
  ===================================================== */

  if (
    hasWord(t, [
      "product",
      "products",
      "flavor",
      "flavors",
      "flavour",
      "flavours",
      "variety",
      "varieties",
      "منتجات",
      "نكهات",
    ]) ||
    hasPhrase(t, [
      "what do you have",
      "what do u have",
      "what do you sell",
      "what are you selling",
      "show me your products",
      "show me what you have",
      "what peanut butter do you have",
      "which flavors do you have",
      "which flavours do you have",
      "what flavors",
      "شو عندكن",
      "شو بتبيعو",
      "شو المنتجات",
      "شو النكهات",
      "quels produits",
      "quels parfums",
    ])
  ) {
    return {
      from: "bot",
      text:
        "We offer different Golden Spreads peanut butter flavors 🥜 Check our Products section to see the available options, ingredients, nutrition information, and prices.",
    };
  }

  /* =====================================================
     INGREDIENTS
  ===================================================== */

  if (
    hasWord(t, [
      "ingredient",
      "ingredients",
      "contain",
      "contains",
      "content",
      "مكونات",
      "مكون",
    ]) ||
    hasPhrase(t, [
      "what is inside",
      "what is in it",
      "whats inside",
      "what does it contain",
      "what is it made of",
      "what is it made from",
      "what are they made from",
      "شو فيها",
      "شو المكونات",
      "من شو معموله",
      "les ingredients",
      "les ingrédients",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Ingredients vary by flavor 🌱 You'll find the exact ingredient list directly on each Golden Spreads product card.",
    };
  }

  /* =====================================================
     NUTRITION / MACROS
  ===================================================== */

  if (
    hasWord(t, [
      "nutrition",
      "nutritional",
      "calorie",
      "calories",
      "protein",
      "carb",
      "carbs",
      "carbohydrate",
      "carbohydrates",
      "fat",
      "fats",
      "macro",
      "macros",
      "بروتين",
      "سعرات",
    ]) ||
    hasPhrase(t, [
      "nutrition facts",
      "nutrition information",
      "nutritional information",
      "nutritional value",
      "how much protein",
      "how many calories",
      "how many carbs",
      "how much fat",
      "what are the macros",
      "القيم الغذائيه",
      "valeurs nutritionnelles",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Nutrition values differ between flavors 💪 Check the product card for calories, protein, carbohydrates, fats, and other available nutrition information.",
    };
  }

  /* =====================================================
     SUGAR
  ===================================================== */

  if (
    hasWord(t, [
      "sugar",
      "sugars",
      "sweetener",
      "sweetened",
      "سكر",
      "sucre",
    ]) ||
    hasPhrase(t, [
      "added sugar",
      "no added sugar",
      "sugar free",
      "without sugar",
      "does it contain sugar",
      "does it have sugar",
      "how much sugar",
      "فيها سكر",
      "بدون سكر",
      "sans sucre",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Sugar content depends on the flavor 🌿 Check the ingredients and nutrition information on the specific product card for the exact details.",
    };
  }

  /* =====================================================
     KETO / LOW CARB
  ===================================================== */

  if (
    hasWord(t, [
      "keto",
      "كيتو",
    ]) ||
    hasPhrase(t, [
      "low carb",
      "low carbohydrate",
      "keto friendly",
      "is it keto",
      "مناسب للكيتو",
    ])
  ) {
    return {
      from: "bot",
      text:
        "For keto or low-carb diets, check the carbohydrates and sugar information of the specific flavor 💪 Different Golden Spreads products may have different nutrition values.",
    };
  }

  /* =====================================================
     VEGAN
  ===================================================== */

  if (
    hasWord(t, [
      "vegan",
      "نباتي",
      "vegetalien",
    ]) ||
    hasPhrase(t, [
      "plant based",
      "is it vegan",
      "vegan friendly",
      "fully vegan",
      "مناسب للنباتيين",
      "végétalien",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Peanuts are naturally plant-based 🌱, but ingredients can vary between flavors. Check the ingredient list of the specific product to confirm.",
    };
  }

  /* =====================================================
     GLUTEN
  ===================================================== */

  if (
    hasWord(t, [
      "gluten",
      "غلوتين",
    ]) ||
    hasPhrase(t, [
      "gluten free",
      "is it gluten free",
      "does it contain gluten",
      "does it have gluten",
      "sans gluten",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Peanuts are naturally gluten-free 🥜, but some flavored products may contain ingredients with gluten. Check the ingredient list of the specific flavor.",
    };
  }

  /* =====================================================
     ALLERGIES
  ===================================================== */

  if (
    hasWord(t, [
      "allergy",
      "allergies",
      "allergic",
      "allergen",
      "allergens",
      "حساسيه",
      "allergie",
    ]) ||
    hasPhrase(t, [
      "i have an allergy",
      "i am allergic",
      "peanut allergy",
      "food allergy",
      "allergy information",
      "عندي حساسيه",
    ])
  ) {
    return {
      from: "bot",
      text:
        "⚠️ Golden Spreads peanut butter contains peanuts. If you have any food allergy, carefully review the complete ingredient information before consuming the product.",
    };
  }

  /* =====================================================
     PALM OIL
  ===================================================== */

  if (
    hasPhrase(t, [
      "palm oil",
      "does it have palm oil",
      "does it contain palm oil",
      "زيت النخيل",
      "huile de palme",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Check the ingredient list of the specific Golden Spreads flavor for its exact oil and ingredient information 🌱",
    };
  }

  /* =====================================================
     STORAGE / FRIDGE
  ===================================================== */

  if (
    hasWord(t, [
      "storage",
      "store",
      "fridge",
      "refrigerator",
      "refrigeration",
      "refrigerate",
      "براد",
      "ثلاجه",
      "conserver",
    ]) ||
    hasPhrase(t, [
      "how should i store it",
      "how do i store it",
      "where should i keep it",
      "where do i keep it",
      "should i refrigerate it",
      "does it need refrigeration",
      "should i put it in the fridge",
      "does it go in the fridge",
      "كيف خزنا",
      "وين خزنا",
      "لازم براد",
      "comment conserver",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Keep the jar properly closed and follow the storage instructions written on your Golden Spreads jar 🥜",
    };
  }

  /* =====================================================
     OIL SEPARATION
  ===================================================== */

  if (
    hasWord(t, [
      "separation",
      "separated",
    ]) ||
    hasPhrase(t, [
      "oil on top",
      "oil at the top",
      "why is there oil",
      "why is there oil on top",
      "oil separated",
      "oil separation",
      "زيت فوق",
      "الزيت طلع لفوق",
      "فصل الزيت",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Natural oil separation can happen in peanut butter 🥜 Simply stir it well until the texture becomes even again.",
    };
  }

  /* =====================================================
     EXPIRY / SHELF LIFE
  ===================================================== */

  if (
    hasWord(t, [
      "expiry",
      "expire",
      "expired",
      "expiration",
      "صلاحية",
      "انتهاء",
    ]) ||
    hasPhrase(t, [
      "shelf life",
      "how long does it last",
      "how long can i keep it",
      "when does it expire",
      "expiry date",
      "expiration date",
      "قديش بتقعد",
      "امتى بتنتهي",
      "تاريخ الانتهاء",
      "date expiration",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Please check the production and expiry information on your Golden Spreads jar 📅 For questions about a specific batch, contact us directly on WhatsApp.",
    };
  }

  /* =====================================================
     PICKUP
  ===================================================== */

  if (
    hasWord(t, [
      "pickup",
      "استلام",
      "retrait",
    ]) ||
    hasPhrase(t, [
      "can i pick it up",
      "where can i pick it up",
      "come get it",
      "collect my order",
      "pickup location",
      "فيني استلمها",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Pickup arrangements can be confirmed directly with us on WhatsApp 📍",
    };
  }

  /* =====================================================
     LOCATION
  ===================================================== */

  if (
    hasWord(t, [
      "location",
      "address",
      "عنوان",
    ]) ||
    hasPhrase(t, [
      "where are you",
      "where are you located",
      "where are you based",
      "where is golden spreads",
      "where is your shop",
      "what is your address",
      "وين انتو",
      "وين محلكن",
      "شو العنوان",
      "où êtes-vous",
    ])
  ) {
    return {
      from: "bot",
      text:
        "For our current pickup location or delivery arrangements, contact us directly through WhatsApp 📍",
    };
  }

  /* =====================================================
     PAYMENT
  ===================================================== */

  if (
    hasWord(t, [
      "payment",
      "pay",
      "cash",
      "دفع",
      "paiement",
    ]) ||
    hasPhrase(t, [
      "how do i pay",
      "how can i pay",
      "payment method",
      "payment methods",
      "cash on delivery",
      "do you accept cash",
      "كيف بدفع",
      "طريقة الدفع",
      "mode de paiement",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Payment details are confirmed when you place your order through WhatsApp 💳📲",
    };
  }

  /* =====================================================
     AVAILABILITY / STOCK
  ===================================================== */

  if (
    hasWord(t, [
      "available",
      "availability",
      "stock",
      "restock",
      "متوفر",
      "موجود",
      "disponible",
    ]) ||
    hasPhrase(t, [
      "sold out",
      "out of stock",
      "is it available",
      "do you have it available",
      "do you have it in stock",
      "when will you restock",
      "when will it be available",
      "امتى بيتوفر",
      "en stock",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Because Golden Spreads products are prepared in small batches, availability can change 🥜 Message us on WhatsApp to confirm the flavor you want.",
    };
  }

  /* =====================================================
     RECIPES / HOW TO EAT
  ===================================================== */

  if (
    hasWord(t, [
      "recipe",
      "recipes",
      "toast",
      "oats",
      "smoothie",
      "smoothies",
      "pancake",
      "pancakes",
      "وصفه",
    ]) ||
    hasPhrase(t, [
      "how do i eat it",
      "how can i eat it",
      "how should i eat it",
      "what can i eat it with",
      "what goes with peanut butter",
      "how can i use it",
      "give me a recipe",
      "شو باكلها مع",
      "كيف باكلها",
      "كيف استعملها",
      "comment manger",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Golden Spreads is delicious with toast, oats, bananas, pancakes, smoothies, baking, desserts — or straight from the spoon 🥄🥜",
    };
  }

  /* =====================================================
     HOMEMADE / SMALL BATCH
  ===================================================== */

  if (
    hasWord(t, [
      "homemade",
      "handmade",
    ]) ||
    hasPhrase(t, [
      "small batch",
      "small batches",
      "made at home",
      "is it homemade",
      "هوم ميد",
      "هاند ميد",
      "fait maison",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Golden Spreads peanut butter is prepared in small batches with a focus on freshness, quality, and great taste 🥜💛",
    };
  }

  /* =====================================================
     CONTACT / HUMAN
  ===================================================== */

  if (
    hasWord(t, [
      "contact",
      "whatsapp",
      "phone",
      "human",
      "رقم",
    ]) ||
    hasPhrase(t, [
      "how can i contact you",
      "how do i contact you",
      "talk to someone",
      "speak to someone",
      "talk to a human",
      "speak to a human",
      "customer service",
      "phone number",
      "whatsapp number",
      "بدي احكي مع حدا",
      "رقم واتساب",
    ])
  ) {
    return {
      from: "bot",
      text:
        "Of course 😊 You can contact Golden Spreads directly through the WhatsApp button on our website.",
    };
  }

  /* =====================================================
     COMPLIMENT
  ===================================================== */

  if (
    hasWord(t, [
      "amazing",
      "delicious",
      "awesome",
      "tasty",
      "زاكي",
      "طيبه",
    ]) ||
    hasPhrase(t, [
      "i love it",
      "i love your products",
      "best peanut butter",
      "so good",
      "very good",
      "great product",
      "كتير طيبه",
      "كتير زاكيه",
      "délicieux",
      "tres bon",
    ])
  ) {
    return {
      from: "bot",
      text: randomReply([
        "Thank you so much! 💛 We're really happy you enjoyed Golden Spreads 🥜",
        "That means a lot to us 💛 Thanks for supporting Golden Spreads!",
        "We're so happy to hear that 😍🥜",
      ]),
    };
  }

  /* =====================================================
     SMART FALLBACK
  ===================================================== */

  return {
    from: "bot",
    text:
      "I’m not completely sure I understood that 😊 I can help with products, prices, ingredients, nutrition, allergens, laboratory testing, ordering, delivery, storage, or availability. You can also contact us directly on WhatsApp 📲",
  };
}