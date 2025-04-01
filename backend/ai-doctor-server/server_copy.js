/*************************************************
 * server.js
 * A minimal Node.js + Express server that calls
 * OpenAI's ChatGPT API securely.
 *************************************************/
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch"); 
require("dotenv").config(); // Loads environment variables from .env file

const app = express();

// 1) Enable CORS for development (allow requests from your iOS app)
app.use(cors());

// 2) Parse JSON bodies
app.use(express.json());

// 3) Read the OpenAI API key from environment variables (see .env setup below)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log("DEBUG: OPENAI_API_KEY =>", OPENAI_API_KEY); // TEMP LOG

/*************************************************
 * POST /ask
 * Expects: { "userMessage": "some question" }
 * Returns: { "response": "AI answer" }
 *************************************************/
app.post("/ask", async (req, res) => {
  try {
    // a) Extract user message from request body
    const userMessage = req.body.userMessage || "";

    // b) Prepare the messages array (system role + user role)
    const messages = [
      { role: "system", content: "You are a helpful AI Doctor." },
      { role: "user", content: userMessage }
    ];

    // c) Make the request to OpenAI's Chat API
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Use the OPENAI_API_KEY we loaded from .env
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",  // or "gpt-4" if you have access // or "gpt-3.5-turbo"
        messages
      })
    });

    // d) Parse the JSON response from OpenAI
    const data = await openAIResponse.json();

    // e) Extract the AI's reply text from `data.choices[0].message.content`
    const aiMessage = data?.choices?.[0]?.message?.content || "No response from AI";

    // f) Send it back to the iOS client
    res.json({ response: aiMessage });
  } catch (error) {
    console.error("Error in /ask route:", error);
    // Return a 500 error if something goes wrong
    res.status(500).json({ error: "Error calling OpenAI API" });
  }
});

/*************************************************
 * Start the server
 *************************************************/
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
