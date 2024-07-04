import React, { useState, useRef } from "react";
import { Mp3Encoder } from "@breezystack/lamejs";

const AudioRecorder: React.FC = () => {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mp3Url, setMp3Url] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "audio/webm",
    });

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = async () => {
      // Combine all audio chunks into a single Blob
      const allChunks = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const audioUrl = URL.createObjectURL(allChunks);
      setAudioUrl(audioUrl);

      // Convert WebM to MP3
      const mp3Blob = await convertWebmToMp3(allChunks);
      const mp3Url = URL.createObjectURL(mp3Blob);
      setMp3Url(mp3Url);
    };

    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const convertWebmToMp3 = async (webmBlob: Blob): Promise<Blob> => {
    const webmArrayBuffer = await webmBlob.arrayBuffer();
    const webmAudioContext = new AudioContext();
    const audioBuffer = await webmAudioContext.decodeAudioData(webmArrayBuffer);

    const sampleRate = audioBuffer.sampleRate;
    const mp3Encoder = new Mp3Encoder(1, sampleRate, 128);
    const samples = new Int16Array(audioBuffer.length);
    const mp3Chunks: Uint8Array[] = [];

    // Get raw PCM data from the audio buffer
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < audioBuffer.length; i++) {
      samples[i] = Math.max(-1, Math.min(1, channelData[i])) * 32767;
    }

    // Encode to MP3
    const mp3Data = mp3Encoder.encodeBuffer(samples);
    if (mp3Data.length > 0) {
      mp3Chunks.push(new Uint8Array(mp3Data));
    }

    // Finish encoding
    const mp3DataEnd = mp3Encoder.flush();
    if (mp3DataEnd.length > 0) {
      mp3Chunks.push(new Uint8Array(mp3DataEnd));
    }

    const mp3Blob = new Blob(mp3Chunks, { type: "audio/mp3" });
    return mp3Blob;
  };

  return (
    <div className="flex flex-col gap-5  text-2xl">
      <button
        onClick={recording ? stopRecording : startRecording}
        className="p-4 bg-gray-100 shadow-xl text-black outline-none "
      >
        {recording ? "Stop Recording" : "Start Recording"}
      </button>
      {mp3Url && <audio controls src={mp3Url!} />}
      {/* {mp3Url && (
        <a href={mp3Url} download="recording.mp3">
          Download MP3
        </a>
      )} */}
    </div>
  );
};

export default AudioRecorder;
