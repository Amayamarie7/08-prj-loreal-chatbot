/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Store chat history and context
let chatHistory = [];
let userContext = { name: null }; // Track user-specific details like name

// Show a welcome message as an assistant bubble
chatWindow.innerHTML = "";
addMessage("assistant", "👋 Hello! How can I help you today?");

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's message
  const message = userInput.value.trim();
  if (message === "") return;

  // Add user's message to chat history
  chatHistory.push({ role: "user", content: message });

  // Add user's message as a bubble
  addMessage("user", message);

  // Clear the input box
  userInput.value = "";

  // --- Show a loading bubble with animated dots ---
  const loadingBubble = document.createElement("div");
  loadingBubble.className = "assistant-message";
  loadingBubble.innerHTML = `<span class="loading-dots">...</span>`;
  chatWindow.appendChild(loadingBubble);

  try {
    const apiKey = OPENAI_API_KEY; // secrets.js must define OPENAI_API_KEY

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          {
            role: "system",
            content: `User context: ${JSON.stringify(userContext)}`,
          }, // Include user context
          ...chatHistory, // Include chat history in the API request
        ],
      }),
    });

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Update user context if the assistant provides new details (e.g., name)
    if (assistantMessage.includes("your name")) {
      const nameMatch = assistantMessage.match(/My name is (\w+)/);
      if (nameMatch) {
        userContext.name = nameMatch[1];
      }
    }

    // Add assistant's message to chat history
    chatHistory.push({ role: "assistant", content: assistantMessage });

    // Remove the loading bubble
    chatWindow.removeChild(loadingBubble);

    // Add assistant's response as a bubble
    addMessage("assistant", assistantMessage);
  } catch (error) {
    console.error("Error fetching OpenAI response:", error);

    // Remove the loading bubble
    chatWindow.removeChild(loadingBubble);

    addMessage(
      "assistant",
      "Sorry, I couldn't process your request. Please try again."
    );
  }
});

// This function adds a message to the chat window as a chat bubble
function addMessage(role, text) {
  // Create a new div for the message
  const messageDiv = document.createElement("div");

  // Add a class for user or assistant to style as a bubble
  messageDiv.className = role === "user" ? "user-message" : "assistant-message";

  // Set the text content of the message
  messageDiv.textContent = text;

  // Append the message to the chat window
  chatWindow.appendChild(messageDiv);

  // Scroll to the bottom so the latest message is visible
  chatWindow.scrollTop = chatWindow.scrollHeight;
}
