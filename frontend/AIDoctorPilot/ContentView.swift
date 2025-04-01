//
//  ContentView.swift
//  AIDoctorPilot
//
//  Created by Maximilian Paterno on 22.01.25.
//

import SwiftUI

struct ContentView: View {
    // 1) User's question / symptom input
    @State private var userMessage = ""
    
    // 2) AI response to display
    @State private var aiResponse = "Ask me something about your health."
    
    // 3) Toggle for showing a loading spinner
    @State private var isLoading = false
    
    // 4) Your server endpoint (local dev)
    // If your server is on the same machine, using simulator, "http://127.0.0.1:3000/ask" usually works.
    // If that doesn't work, try "http://localhost:3000/ask".
    //private let serverURL = URL(string: "http://127.0.0.1:3000/ask")! // For Simulator, use local host http://127.0.0.1:3000/ask or http://localhost:3000/ask
    private let serverURL = URL(string: "http://127.0.0.1:3000/ask")! // For use on Iphone, use Mac’s local IP address
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // A. TextField for user input
                TextField("Describe symptoms or ask a question...", text: $userMessage)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding(.horizontal)
                
                // B. Send button
                Button(action: {
                    // Call the server asynchronously
                    Task {
                        await sendQuestionToServer()
                    }
                }) {
                    Text("Ask AI Doctor")
                        .frame(maxWidth: .infinity)
                }
                .padding(.horizontal)
                .disabled(userMessage.isEmpty || isLoading)
                
                // C. If loading, show a spinner
                if isLoading {
                    ProgressView("Asking...")
                }
                
                // D. Show AI response
                ScrollView {
                    Text(aiResponse)
                        .padding()
                }
                
                Spacer()
            }
            .navigationTitle("AI Doctor Pilot")
        }
    }
    
    // MARK: - Networking with Async/Await
    func sendQuestionToServer() async {
        // 1) Indicate loading
        isLoading = true
        
        // 2) Prepare JSON payload
        //    The server expects {"userMessage": "<USER INPUT>"}
        let payload: [String: String] = [
            "userMessage": userMessage
        ]
        
        do {
            // Convert Swift dictionary to JSON data
            let jsonData = try JSONSerialization.data(withJSONObject: payload)
            
            // Create a URLRequest for your server's /ask endpoint
            var request = URLRequest(url: serverURL)
            request.httpMethod = "POST"
            // Set the content type to JSON
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = jsonData
            
            // 3) Make the network call using URLSession
            let (data, _) = try await URLSession.shared.data(for: request)
            
            // 4) Parse the server's JSON response: { "response": "AI answer" }
            if let jsonObject = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let serverResponse = jsonObject["response"] as? String {
                
                // Update the UI on the main thread
                await MainActor.run {
                    self.aiResponse = serverResponse
                }
            } else {
                await MainActor.run {
                    self.aiResponse = "No valid response from server."
                }
            }
        } catch {
            // In case of any errors, display them
            print("Error: \(error)")
            await MainActor.run {
                self.aiResponse = "Error calling the server."
            }
        }
        
        // 5) Finished loading
        isLoading = false
    }
}
