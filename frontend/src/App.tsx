import React from 'react';
import Chat from './Chat';

function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <h1 style={{ textAlign: 'center', margin: '32px 0 0 0', fontWeight: 700, color: '#1976d2' }}>
        ChatGPT Wrapper App
      </h1>
      <Chat />
    </div>
  );
}

export default App;
