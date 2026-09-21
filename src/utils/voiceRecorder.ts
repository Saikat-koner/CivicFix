import { apiClient } from '../services/api';

export interface VoiceRecordingSession {
  stream: MediaStream;
  mediaRecorder: MediaRecorder;
  audioChunks: Blob[];
  audioContext?: AudioContext;
  analyser?: AnalyserNode;
  dataArray?: Uint8Array;
}

export class VoiceRecorderService {
  private currentSession: VoiceRecordingSession | null = null;
  private animFrameId: number | null = null;
  private volumeListeners: ((volume: number) => void)[] = [];

  public onVolume(listener: (volume: number) => void): () => void {
    this.volumeListeners.push(listener);
    return () => {
      this.volumeListeners = this.volumeListeners.filter((l) => l !== listener);
    };
  }

  private notifyVolume(vol: number) {
    this.volumeListeners.forEach((l) => l(vol));
  }

  /**
   * Accesses the real device microphone via getUserMedia and starts recording.
   * Connects AnalyserNode to emit live sound volume for audio visualizers.
   */
  public async startRecording(): Promise<MediaStream> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Microphone audio capture is not supported in this browser or environment.');
    }

    // Stop any existing session
    this.stopSession();

    // Request genuine microphone access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const audioChunks: Blob[] = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/mp4')
      ? 'audio/mp4'
      : 'audio/webm';

    const mediaRecorder = new MediaRecorder(stream, { mimeType });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        audioChunks.push(e.data);
      }
    };

    mediaRecorder.start(250); // Collect data chunks every 250ms

    // Set up Web Audio API visualizer analyzer
    let audioContext: AudioContext | undefined;
    let analyser: AnalyserNode | undefined;
    let dataArray: Uint8Array | undefined;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
        const source = audioContext.createMediaStreamSource(stream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        const pollVolume = () => {
          if (analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(100, Math.round((avg / 128) * 100));
            this.notifyVolume(normalized);
          }
          this.animFrameId = requestAnimationFrame(pollVolume);
        };
        this.animFrameId = requestAnimationFrame(pollVolume);
      }
    } catch (err) {
      console.warn('[VoiceRecorder] Web Audio analyser init skipped:', err);
    }

    this.currentSession = {
      stream,
      mediaRecorder,
      audioChunks,
      audioContext,
      analyser,
      dataArray,
    };

    return stream;
  }

  /**
   * Stops recording, collects audio blob, and transcribes using Gemini 3.8 Flash multimodal audio API
   */
  public async stopAndTranscribe(): Promise<{ transcript: string; audioBlob: Blob; confidence: number }> {
    if (!this.currentSession) {
      throw new Error('No active recording session to transcribe.');
    }

    const { mediaRecorder, audioChunks, stream } = this.currentSession;

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = async () => {
        try {
          const mime = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunks, { type: mime });

          // Convert blob to Base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const base64Audio = reader.result as string;
              // Transcribe real recorded audio with Gemini 3.8 Flash
              const result = await apiClient.transcribeAudio(base64Audio, mime);
              this.stopSession();
              resolve({
                transcript: result?.transcript || '',
                audioBlob,
                confidence: result?.confidence || 95.0,
              });
            } catch (err) {
              this.stopSession();
              reject(err);
            }
          };
          reader.onerror = () => {
            this.stopSession();
            reject(new Error('Failed reading recorded audio data.'));
          };
        } catch (err) {
          this.stopSession();
          reject(err);
        }
      };

      try {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      } catch (err) {
        this.stopSession();
        reject(err);
      }
    });
  }

  public stopSession() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.currentSession) {
      try {
        if (this.currentSession.mediaRecorder.state !== 'inactive') {
          this.currentSession.mediaRecorder.stop();
        }
      } catch {
        // ignore
      }
      try {
        this.currentSession.stream.getTracks().forEach((t) => t.stop());
      } catch {
        // ignore
      }
      try {
        if (this.currentSession.audioContext) {
          this.currentSession.audioContext.close();
        }
      } catch {
        // ignore
      }
      this.currentSession = null;
    }
    this.notifyVolume(0);
  }

  public isRecording(): boolean {
    return this.currentSession !== null && this.currentSession.mediaRecorder.state === 'recording';
  }
}

export const voiceRecorder = new VoiceRecorderService();
