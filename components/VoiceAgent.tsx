import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Sparkles } from './Icons';
import { Button, Card, SectionHeader } from './ui';

interface RelayMessage {
  type: 'audio' | 'interrupted' | 'error' | 'ready';
  data?: string;
  mimeType?: string;
  message?: string;
}

const SUGGESTED_PROMPTS = [
  'Resumo de saúde do rebanho hoje',
  'Prioridades para o pasto norte',
  'Checklist rápido de hidratação',
  'Recomendações para estresse térmico',
];

const getRelayUrl = () => {
  const override = import.meta.env.VITE_VOICE_RELAY_URL as string | undefined;
  if (override) return override;
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/voice`;
};

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

function createPayload(data: Float32Array) {
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = () => {
    if (socketRef.current) {
      const socket = socketRef.current;
      socketRef.current = null;
      try {
        socket.close();
      } catch {
        // ignore
      }
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
      outputGainRef.current = null;
    }

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
      const socket = new WebSocket(getRelayUrl());
      socketRef.current = socket;

      socket.onopen = async () => {
        try {
          const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

          inputAudioContextRef.current = inputCtx;
          outputAudioContextRef.current = outputCtx;

          const outputNode = outputCtx.createGain();
          outputNode.connect(outputCtx.destination);
          outputGainRef.current = outputNode;

          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;

          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);

          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            if (socket.readyState !== WebSocket.OPEN) return;
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            const pcmPayload = createPayload(inputData);
            const message: RelayMessage = {
              type: 'audio',
              data: pcmPayload.data,
              mimeType: pcmPayload.mimeType,
            };
            socket.send(JSON.stringify(message));
          };

          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
        } catch (err) {
          console.error(err);
          setError('Falha ao iniciar áudio. Verifique permissões.');
          stopSession();
        }
      };

      socket.onmessage = async (event) => {
        try {
          const payload: RelayMessage = JSON.parse(event.data);

          if (payload.type === 'error') {
            setError(payload.message || 'Erro na conexão com o relay.');
            stopSession();
            return;
          }

          if (payload.type === 'interrupted') {
            sourcesRef.current.forEach(s => s.stop());
            sourcesRef.current.clear();
            nextStartTimeRef.current = 0;
            setIsSpeaking(false);
            return;
          }

          if (payload.type === 'audio' && payload.data) {
            setIsSpeaking(true);
            const ctx = outputAudioContextRef.current;
            const gain = outputGainRef.current;
            if (!ctx || !gain) return;

            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

            const audioBuffer = await decodeAudioData(
              decode(payload.data),
              ctx,
              24000,
              1
            );

            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(gain);

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
        } catch (err) {
          console.error('Erro ao processar mensagem do relay', err);
        }
      };

      socket.onerror = () => {
        setError('Erro na conexão com o relay.');
        stopSession();
      };

      socket.onclose = () => {
        stopSession();
      };
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
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)]">
      <div className="space-y-6">
        <SectionHeader
          title="Assistente de Voz"
          subtitle="Interação por áudio para acelerar decisões no campo."
        />

        <Card className="flex flex-col items-center gap-6 text-center">
          <div className={`relative flex h-48 w-48 items-center justify-center rounded-full border-4 ${
            isActive ? 'border-rose-400 bg-rose-500/10' : 'border-[color:var(--accent-2)] bg-[color:var(--accent-2)]/20'
          }`}>
            {isActive && <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-2xl"></div>}
            <div className="relative flex flex-col items-center gap-2">
              {isActive ? <MicOff className="h-12 w-12 text-rose-200" /> : <Mic className="h-12 w-12 text-white" />}
              <span className="text-xs uppercase tracking-[0.4em] text-white">{isActive ? 'Parar' : 'Falar'}</span>
            </div>
          </div>

          <Button variant={isActive ? 'secondary' : 'primary'} onClick={isActive ? stopSession : startSession}>
            {isActive ? 'Encerrar sessão' : 'Iniciar conversa'}
          </Button>

          {error && (
            <div className="rounded-full border border-rose-400/30 bg-rose-500/20 px-4 py-2 text-xs text-rose-100">
              {error}
            </div>
          )}

          {!error && isActive && (
            <div className="flex items-center gap-2 text-xs text-[color:var(--muted)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--accent-2)] opacity-70"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--accent-2)]"></span>
              </span>
              {isSpeaking ? 'IA respondendo' : 'Ouvindo o ambiente'}
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[color:var(--accent)]" />
            <h3 className="font-display text-lg text-white">Comandos sugeridos</h3>
          </div>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Sugestões rápidas para direcionar a conversa.</p>
          <div className="mt-4 space-y-2">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <div key={prompt} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
                {prompt}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--muted)]">Relay seguro</p>
          <p className="mt-2 text-lg font-semibold text-white">Conexão protegida no backend</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">
            Os fluxos de áudio são encaminhados sem exposição de credenciais no navegador.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default VoiceAgent;
