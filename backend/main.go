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

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Messages []Message `json:"messages"`
}

type OpenAIRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
	Stream   bool      `json:"stream"`
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
	var req ChatRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	mutex.Lock()
	history = append(history, req.Messages...)
	mutex.Unlock()

	openaiReq := OpenAIRequest{
		Model:    "gpt-3.5-turbo",
		Messages: history,
		Stream:   false,
	}

	reqBody, _ := json.Marshal(openaiReq)
	openaiAPIKey := os.Getenv("OPENAI_API_KEY")

	request, _ := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(reqBody))
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+openaiAPIKey)

	client := &http.Client{}
	response, err := client.Do(request)
	if err != nil {
		http.Error(w, "OpenAI API call failed", http.StatusInternalServerError)
		return
	}
	defer response.Body.Close()

	body, _ := io.ReadAll(response.Body)
	fmt.Println("OpenAI raw response:", string(body)) // Debug print

	var openaiResp OpenAIResponse
	json.Unmarshal(body, &openaiResp)

	if len(openaiResp.Choices) == 0 {
		// Try to parse error
		var openaiErr OpenAIError
		if err := json.Unmarshal(body, &openaiErr); err == nil && openaiErr.Error.Message != "" {
			http.Error(w, "OpenAI error: "+openaiErr.Error.Message, http.StatusInternalServerError)
			return
		}
		http.Error(w, "No choices from OpenAI", http.StatusInternalServerError)
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
		w.Header().Set("Access-Control-Allow-Origin", "*")
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
