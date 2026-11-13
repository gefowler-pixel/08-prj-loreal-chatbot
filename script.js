/* L'Oréal Smart Product & Routine Advisor */

// Connect to Cloudflare Worker
// Replace this URL after deploying your Worker.
const WORKER_URL = "https://loreal-beauty-advisor.gefowler.workers.dev/";

// HTML elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");
const sendButton = chatForm.querySelector('button[type="submit"]');

// Chatbot instructions
const systemPrompt = `
You are a friendly, knowledgeable L'Oréal beauty advisor.

Only answer questions about L'Oréal products, skincare,
haircare, makeup, fragrances, and related beauty routines.

Provide personalized recommendations based on the
customer's needs, preferences, skin type, hair type,
and budget.

Ask helpful follow-up questions when needed.
Keep responses friendly, professional, and easy to understand.

Do not invent product names, prices, or product benefits.
If uncertain, explain that details should be verified
on the official L'Oréal website.

If someone asks an unrelated question, politely say:
"I'm here to help with L'Oréal beauty products and routines!
What beauty questions can I help you with?"

Remember details shared earlier in the conversation.
`;

// Store conversation history
let conversationHistory = [{ role: "system", content: systemPrompt }];

// Display messages in chat bubbles
function addMessage(message, sender) {
  const bubble = document.createElement("div");

  bubble.classList.add("message", sender);
  bubble.textContent = message;

  chatWindow.appendChild(bubble);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Welcome message
chatWindow.textContent = "";

addMessage(
  "👋 Welcome to your L'Oréal Beauty Advisor! " +
    "Ask me about skincare, makeup, haircare, or routines.",
  "assistant",
);

// Handle user messages
chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const question = userInput.value.trim();

  if (!question) return;

  // Display user's question
  addMessage(question, "user");

  // Remember the question
  conversationHistory.push({
    role: "user",
    content: question,
  });

  // Clear input and prevent repeated submissions
  userInput.value = "";
  userInput.disabled = true;
  sendButton.disabled = true;

  const loadingBubble = document.createElement("div");
  loadingBubble.classList.add("message", "assistant");
  loadingBubble.textContent = "Thinking...";
  chatWindow.appendChild(loadingBubble);

  try {
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: conversationHistory,
      }),
    });

    if (!response.ok) {
      throw new Error("Request failed: " + response.status);
    }

    const data = await response.json();
    console.log("OpenAI response:", data);

    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error("No AI response received.");
    }

    loadingBubble.remove();

    // Display AI response
    addMessage(answer, "assistant");

    // Remember AI response
    conversationHistory.push({
      role: "assistant",
      content: answer,
    });
  } catch (error) {
    console.error("Chatbot error:", error);
    loadingBubble.remove();

    // Remove unsent question from AI history
    conversationHistory.pop();

    addMessage(
      "Sorry, I couldn't connect right now. Please try again.",
      "assistant",
    );
  } finally {
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
});
