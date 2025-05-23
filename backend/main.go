package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

type ImageURL struct {
	URL string `json:"url"`
}

// Update Message struct to handle complex content (text and images)
type ContentItem struct {
	Type     string    `json:"type,omitempty"`
	Text     string    `json:"text,omitempty"`
	ImageURL *ImageURL `json:"image_url,omitempty"`
}

type Message struct {
	Role    string      `json:"role"`
	Content interface{} `json:"content"` // Can be string or []ContentItem
}

type ChatRequest struct {
	Messages []Message `json:"messages"`
}

type OpenAIRequest struct {
	Model     string    `json:"model"`
	Messages  []Message `json:"messages"`
	Stream    bool      `json:"stream"`
	MaxTokens int       `json:"max_tokens,omitempty"`
}

type OpenAIResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

type OpenAIError struct {
	Error struct {
		Message string `json:"message"`
		Type    string `json:"type"`
	} `json:"error"`
}

var history []Message
var mutex sync.Mutex

func handleChat(w http.ResponseWriter, r *http.Request) {
	// Decode the request
	var req struct {
		Model    string    `json:"model"`
		Messages []Message `json:"messages"`
	}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	mutex.Lock()
	history = append(history, req.Messages...)
	mutex.Unlock()

	// Use the model specified in the request or default to gpt-4-vision-preview
	model := req.Model
	if model == "" {
		model = "gpt-4o"
	}

	openaiReq := OpenAIRequest{
		Model:    model,
		Messages: history,
		Stream:   false,
		// Add max_tokens if you need to limit response length
		// MaxTokens: 300,
	}

	// Debug: Print the request being sent to OpenAI
	requestJson, _ := json.MarshalIndent(openaiReq, "", "  ")
	fmt.Println("Sending to OpenAI:", string(requestJson))

	reqBody, _ := json.Marshal(openaiReq)
	openaiAPIKey := os.Getenv("OPENAI_API_KEY")

	request, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+openaiAPIKey)

	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		http.Error(w, "OpenAI API call failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer response.Body.Close()

	body, _ := io.ReadAll(response.Body)

	// Check for error in response
	if response.StatusCode >= 400 {
		fmt.Println("OpenAI error response:", string(body))
		http.Error(w, "OpenAI API error: "+string(body), response.StatusCode)
		return
	}

	var openaiResp OpenAIResponse
	err = json.Unmarshal(body, &openaiResp)
	if err != nil {
		http.Error(w, "Error parsing OpenAI response: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if len(openaiResp.Choices) == 0 {
		http.Error(w, "No choices returned from OpenAI", http.StatusInternalServerError)
		return
	}

	mutex.Lock()
	history = append(history, openaiResp.Choices[0].Message)
	mutex.Unlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(openaiResp.Choices[0].Message)
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "https://almg-walsh.github.io/chatgpt-wrapper-app")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func main() {
	godotenv.Load()
	router := mux.NewRouter()
	router.Use(enableCORS)
	router.HandleFunc("/chat", handleChat).Methods("POST", "OPTIONS")
	fmt.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}
