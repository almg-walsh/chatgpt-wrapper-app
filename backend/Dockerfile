FROM golang:1.19-alpine

WORKDIR /app

# Copy go.mod and go.sum
COPY go.mod ./
COPY go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN go build -o server .

# Expose port 8080
EXPOSE 8080

# Command to run the executable
CMD ["./server"]