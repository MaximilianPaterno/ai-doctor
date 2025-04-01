/*************************************************
 * server.js
 *************************************************/
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

// A) Enable CORS if needed for dev
app.use(cors());

// B) Parse JSON bodies
app.use(express.json());

// C) POST /ask
app.post("/ask", async (req, res) => {
  try {
    // 1) Grab user input
    const userMessage = req.body.userMessage || "";

    // 2) Build a single prompt (Ollama /v1/completions style)
    //    For example, add a system role or instructions at the start:
    const prompt = `You are a helpful AI Doctor.\nUser: ${userMessage}\nAssistant:`;

    // 3) Send request to Ollama /v1/completions
    //    The "model" field is crucial. 
    //    If you have "deepseek-r1:1.5b" pulled, you can specify that name:
    const response = await fetch("http://127.0.0.1:11434/v1/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        // The name of the model you want to use
        model: "deepseek-r1:1.5b",
        prompt: prompt,
        // Optional parameters: temperature, top_p, etc.
        // e.g. temperature: 0.7
      })
    });

    // 4) Parse Ollama's JSON response
    //    Typically: { "completion": "text" }
    const data = await response.json();
    console.log("Ollama response data:", data); // <-- This line is added
    const aiMessage = data?.choices?.[0]?.text || "No response from Ollama";


    // 5) Send it back to your iOS client
    res.json({ response: aiMessage });

  } catch (error) {
    console.error("Error in /ask route:", error);
    res.status(500).json({ error: "Error calling Ollama" });
  }
});

// D) Start the server on port 3000 (or your choice)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
