import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Mic, MicOff, Activity } from './Icons';

// --- Audio Utilities ---

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

const VoiceAgent: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false); // Model is speaking
  const [error, setError] = useState<string | null>(null);
  
  // Refs for audio handling to persist across renders
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null); // To hold the live session
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Cleanup function
  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close(); // Assuming close method exists or just dropping ref
      sessionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }

    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    // Stop all playing sources
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();

    setIsActive(false);
    setIsSpeaking(false);
    nextStartTimeRef.current = 0;
  };

  const startSession = async () => {
    setError(null);
    setIsActive(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

      // Initialize Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const outputNode = outputCtx.createGain();
      outputNode.connect(outputCtx.destination);

      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: `Você é a assistente virtual veterinária do Smart Ranch. 
          Fale de forma breve, profissional mas amigável. 
          Ajude o fazendeiro com dúvidas sobre saúde do gado, clima e recomendações de manejo. 
          Se perguntarem sobre o status atual, invente um resumo baseada em dados fictícios de 'saúde boa' e 'um alerta crítico no pasto norte'.`,
        },
      };

      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            console.log('Session opened');
            // Setup Input Stream Processing
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination); // Mute self? Usually needed to keep processor alive
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (base64Audio) {
              setIsSpeaking(true);
              const ctx = outputAudioContextRef.current;
              if (!ctx) return;

              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );

              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setIsSpeaking(false);
                }
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsSpeaking(false);
            }
          },
          onclose: () => {
            console.log('Session closed');
            stopSession();
          },
          onerror: (e) => {
            console.error('Session error', e);
            setError('Erro na conexão com a IA.');
            stopSession();
          }
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (e) {
      console.error(e);
      setError('Falha ao iniciar áudio. Verifique permissões.');
      stopSession();
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center animate-fadeIn p-6">
      <div className="text-center mb-10 space-y-4">
        <h2 className="text-4xl font-bold text-white">Assistente Veterinária AI</h2>
        <p className="text-slate-400 max-w-md mx-auto">
          Converse em tempo real com a inteligência do Smart Ranch. 
          Tire dúvidas sobre manejo, peça relatórios ou discuta diagnósticos.
        </p>
      </div>

      <div className="relative">
        {/* Visualizer Ring */}
        {isActive && (
          <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping blur-xl"></div>
        )}
        
        {/* Main Button */}
        <button
          onClick={isActive ? stopSession : startSession}
          className={`relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl border-4 ${
            isActive 
              ? 'bg-red-500/10 border-red-500 hover:bg-red-500/20' 
              : 'bg-green-600 hover:bg-green-500 border-green-400'
          }`}
        >
          {isActive ? (
            <div className="flex flex-col items-center gap-2">
              <MicOff className="w-12 h-12 text-red-500" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Parar</span>
            </div>
          ) : (
             <div className="flex flex-col items-center gap-2">
              <Mic className="w-12 h-12 text-white" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Falar</span>
            </div>
          )}
        </button>
      </div>

      {/* Status Indicators */}
      <div className="mt-12 h-16 flex flex-col items-center justify-center">
        {error && (
          <div className="text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
            {error}
          </div>
        )}

        {isActive && !error && (
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-slate-300 font-mono text-sm">
              {isSpeaking ? 'IA Falando...' : 'Ouvindo...'}
            </span>
          </div>
        )}
        
        {/* Audio Wave Visualization Simulation */}
        {isSpeaking && (
           <div className="flex gap-1 mt-4 items-end h-8">
             {[...Array(8)].map((_, i) => (
               <div 
                 key={i} 
                 className="w-1 bg-green-400 rounded-full animate-pulse"
                 style={{ 
                   height: `${Math.random() * 100}%`,
                   animationDuration: `${0.2 + Math.random() * 0.3}s` 
                 }}
               ></div>
             ))}
           </div>
        )}
      </div>

      <div className="mt-auto text-slate-500 text-sm max-w-lg text-center">
        <p>Powered by Google Gemini 2.5 Native Audio Live API</p>
      </div>
    </div>
  );
};

export default VoiceAgent;