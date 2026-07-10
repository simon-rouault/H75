'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Enregistre l'audio du micro via MediaRecorder (marche sur iPhone, contrairement
 * à SpeechRecognition). `stop()` renvoie l'audio en base64 + son mimeType, prêt
 * à être envoyé à Gemini pour transcription + estimation des macros.
 */
export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setSupported(false);
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
      const mime = candidates.find((t) => MediaRecorder.isTypeSupported?.(t));
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      return true;
    } catch {
      setSupported(false);
      setRecording(false);
      return false;
    }
  }, []);

  const stop = useCallback((): Promise<{ base64: string; mimeType: string } | null> => {
    return new Promise((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === 'inactive') { resolve(null); return; }
      recorder.onstop = async () => {
        const type = (recorder.mimeType || 'audio/webm').split(';')[0];
        const blob = new Blob(chunksRef.current, { type });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setRecording(false);
        if (blob.size === 0) { resolve(null); return; }
        const dataUrl: string = await new Promise((res) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result as string);
          fr.readAsDataURL(blob);
        });
        resolve({ base64: dataUrl.split(',')[1], mimeType: type });
      };
      recorder.stop();
    });
  }, []);

  return { recording, supported, start, stop };
}
