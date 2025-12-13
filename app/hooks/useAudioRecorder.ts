'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface UseAudioRecorderReturn {
    // State
    recordingState: RecordingState;
    recordingTime: number; // in seconds
    audioBlob: Blob | null;
    audioUrl: string | null;
    error: string | null;

    // Actions
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    resetRecording: () => void;

    // Permissions
    hasPermission: boolean | null;
    requestPermission: () => Promise<boolean>;
}

/**
 * Provides a React hook that manages audio recording using the MediaRecorder API.
 *
 * Manages microphone permission requests, recording lifecycle (start, pause, resume, stop, reset),
 * elapsed recording time, recorded audio Blob and object URL, and error state. Cleans up media
 * tracks, timers, and object URLs on unmount or when recordings are replaced.
 *
 * @returns An object exposing recording state and data (`recordingState`, `recordingTime`, `audioBlob`, `audioUrl`, `error`), actions (`startRecording`, `stopRecording`, `pauseRecording`, `resumeRecording`, `resetRecording`), and permission helpers (`hasPermission`, `requestPermission`).
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup audio URL on unmount or when new recording starts
    useEffect(() => {
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [audioUrl]);

    const requestPermission = useCallback(async (): Promise<boolean> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            setHasPermission(true);
            setError(null);
            return true;
        } catch (err) {
            setHasPermission(false);
            setError('Microphone permission denied. Please allow access to record.');
            return false;
        }
    }, []);

    const startRecording = useCallback(async () => {
        try {
            setError(null);

            // Clean up previous recording
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
                setAudioUrl(null);
            }
            setAudioBlob(null);
            chunksRef.current = [];

            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100,
                }
            });
            streamRef.current = stream;
            setHasPermission(true);

            // Create MediaRecorder
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/mp4';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);

                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                }
            };

            mediaRecorder.onerror = () => {
                setError('Recording failed. Please try again.');
                setRecordingState('idle');
            };

            // Start recording
            mediaRecorder.start(1000); // Collect data every second
            setRecordingState('recording');
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (err: any) {
            if (err.name === 'NotAllowedError') {
                setError('Microphone permission denied. Please allow access to record.');
                setHasPermission(false);
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone.');
            } else {
                setError('Failed to start recording. Please try again.');
            }
            setRecordingState('idle');
        }
    }, [audioUrl]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && recordingState === 'recording') {
            mediaRecorderRef.current.stop();
            setRecordingState('stopped');

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [recordingState]);

    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && recordingState === 'recording') {
            mediaRecorderRef.current.pause();
            setRecordingState('paused');

            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [recordingState]);

    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && recordingState === 'paused') {
            mediaRecorderRef.current.resume();
            setRecordingState('recording');

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        }
    }, [recordingState]);

    const resetRecording = useCallback(() => {
        // Stop any ongoing recording
        if (mediaRecorderRef.current && (recordingState === 'recording' || recordingState === 'paused')) {
            mediaRecorderRef.current.stop();
        }

        // Clear timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Stop stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        // Clean up URL
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }

        // Reset state
        setRecordingState('idle');
        setRecordingTime(0);
        setAudioBlob(null);
        setAudioUrl(null);
        setError(null);
        chunksRef.current = [];
    }, [recordingState, audioUrl]);

    return {
        recordingState,
        recordingTime,
        audioBlob,
        audioUrl,
        error,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        resetRecording,
        hasPermission,
        requestPermission,
    };
}

/**
 * Format a duration given in seconds as an "MM:SS" timestamp.
 *
 * @param seconds - Duration in seconds to format
 * @returns The time formatted as `MM:SS` with minutes and seconds zero-padded to two digits
 */
export function formatRecordingTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}