import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5001");

const ROOM = "minimeet-room";

function App() {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const peerConnection = useRef(null);
    const localStream = useRef(null);

    const [joined, setJoined] = useState(false);

    useEffect(() => {
        socket.on("connect", () => {
            console.log("Connected to server:", socket.id);
        });

        // First user creates the offer
        socket.on("ready", async () => {
            console.log("Another user joined. Creating offer...");

            await createPeerConnection();

            const offer = await peerConnection.current.createOffer();

            await peerConnection.current.setLocalDescription(offer);

            socket.emit("offer", {
                room: ROOM,
                offer,
            });
        });

        // Second user receives the offer
        socket.on("offer", async (offer) => {
            console.log("Offer received");

            await createPeerConnection();

            await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(offer)
            );

            const answer =
                await peerConnection.current.createAnswer();

            await peerConnection.current.setLocalDescription(answer);

            socket.emit("answer", {
                room: ROOM,
                answer,
            });
        });

        // First user receives the answer
        socket.on("answer", async (answer) => {
            console.log("Answer received");

            await peerConnection.current.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        });

        // ICE candidates
        socket.on("ice-candidate", async (candidate) => {
            if (peerConnection.current) {
                try {
                    await peerConnection.current.addIceCandidate(
                        new RTCIceCandidate(candidate)
                    );
                } catch (error) {
                    console.error(
                        "Error adding ICE candidate:",
                        error
                    );
                }
            }
        });

        socket.on("peer-left", () => {
            console.log("Other user left");

            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = null;
            }

            if (peerConnection.current) {
                peerConnection.current.close();
                peerConnection.current = null;
            }
        });

        return () => {
            socket.off("connect");
            socket.off("ready");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("peer-left");
        };
    }, []);

    const createPeerConnection = async () => {
        if (peerConnection.current) {
            return;
        }

        const pc = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302",
                },
            ],
        });

        peerConnection.current = pc;

        // Send our ICE candidates through Socket.IO
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice-candidate", {
                    room: ROOM,
                    candidate: event.candidate,
                });
            }
        };

        // Receive the other person's video/audio
        pc.ontrack = (event) => {
            console.log("Remote stream received");

            remoteVideoRef.current.srcObject = event.streams[0];
        };

        // Add camera and microphone tracks
        if (localStream.current) {
            localStream.current
                .getTracks()
                .forEach((track) => {
                    pc.addTrack(track, localStream.current);
                });
        }
    };

    const startMeeting = async () => {
        try {
            const stream =
                await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });

            localStream.current = stream;

            localVideoRef.current.srcObject = stream;

            socket.emit("join-room", ROOM);

            setJoined(true);

            console.log("Joined MiniMeet room");
        } catch (error) {
            console.error(
                "Camera/microphone error:",
                error
            );
        }
    };

    return (
        <div>
            <h1>MiniMeet 🎥</h1>

            {!joined && (
                <button onClick={startMeeting}>
                    Join Meeting
                </button>
            )}

            <div>
                <h2>My Video</h2>

                <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    width="400"
                />
            </div>

            <div>
                <h2>Remote Video</h2>

                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    width="400"
                />
            </div>
        </div>
    );
}

export default App;