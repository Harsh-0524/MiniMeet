# MiniMeet 🎥

MiniMeet is a basic 1-to-1 video conferencing application built to understand the fundamentals of WebRTC and real-time communication.

I started this project while exploring open-source projects such as Jitsi. The purpose was to get practical experience with concepts like WebRTC, signaling, SDP, ICE candidates and peer-to-peer communication before exploring a larger codebase.

## Features

- 1-to-1 video calling
- Camera and microphone access
- WebRTC peer-to-peer connection
- SDP offer/answer exchange
- ICE candidate exchange
- Socket.IO-based signaling
- React frontend
- Node.js backend

## Tech Stack

- React
- JavaScript
- Node.js
- Express.js
- Socket.IO
- WebRTC
- Vite

## How It Works

The application uses Socket.IO as the signaling layer.

```text
Browser A
    │
    │  Signaling
    ▼
Node.js + Socket.IO
    │
    │  Signaling
    ▼
Browser B

Browser A ═════════════ Browser B
             WebRTC
          Audio + Video