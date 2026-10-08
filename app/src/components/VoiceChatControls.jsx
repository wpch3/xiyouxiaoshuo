import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Mic, MicOff, Volume2 } from 'lucide-react';
import { aiService } from '../utils/aiService';

export const VoiceChatControls = ({ text = '', onTranscript = () => {}, accentColor = '#60A5FA' }) => {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const speechRecognitionRef = useRef(null);

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    speechRecognitionRef.current?.stop?.();
    if (audioRef.current) {
      audioRef.current.pause();
      URL.revokeObjectURL(audioRef.current.src);
    }
  }, []);

  const startBrowserRecognition = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setMessage('此设备没有可用的语音识别。配置语音 API 后可使用 API 识别。');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) onTranscript(transcript);
      setMessage(transcript ? '语音已转成文字，可检查后发送。' : '没有识别到语音。');
    };
    recognition.onerror = (event) => setMessage(`语音识别失败：${event.error || '未知错误'}`);
    recognition.onend = () => {
      setRecording(false);
      speechRecognitionRef.current = null;
    };
    speechRecognitionRef.current = recognition;
    setRecording(true);
    setMessage('正在听…');
    recognition.start();
  };

  const transcribeRecording = async (blob) => {
    setBusy(true);
    setMessage('正在调用语音识别 API…');
    try {
      const transcript = await aiService.transcribeAudio(blob);
      if (transcript) onTranscript(transcript);
      setMessage(transcript ? '识别完成，可检查后发送。' : '没有识别到语音。');
    } catch (error) {
      setMessage(error.message || '语音识别失败');
    } finally {
      setBusy(false);
    }
  };

  const toggleRecording = async () => {
    if (busy) return;
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      return;
    }
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }

    const key = aiService.getVoiceApiKey();
    if (!key) {
      startBrowserRecognition();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      startBrowserRecognition();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : undefined;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data?.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size) transcribeRecording(blob);
        else setMessage('没有录到音频。');
      };
      recorder.start();
      setRecording(true);
      setMessage('正在录音，再按一次结束并调用 API 识别。');
    } catch (error) {
      setMessage(`无法打开麦克风：${error.message || '请检查麦克风权限'}`);
      startBrowserRecognition();
    }
  };

  const speak = async () => {
    const speechText = String(text || '').trim();
    if (!speechText) {
      setMessage('还没有可播报的回答。');
      return;
    }
    setBusy(true);
    try {
      if (aiService.getVoiceApiKey()) {
        setMessage('正在生成 API 语音…');
        const blob = await aiService.synthesizeSpeech(speechText);
        if (audioRef.current) {
          audioRef.current.pause();
          URL.revokeObjectURL(audioRef.current.src);
        }
        const url = URL.createObjectURL(blob);
        const player = new Audio(url);
        audioRef.current = player;
        player.onended = () => URL.revokeObjectURL(url);
        await player.play();
        setMessage('正在播放 API 语音。');
      } else if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = 'zh-CN';
        utterance.onstart = () => setMessage('正在使用设备语音播报。');
        utterance.onerror = () => setMessage('设备语音播报失败。');
        utterance.onend = () => setMessage('');
        window.speechSynthesis.speak(utterance);
      } else {
        setMessage('当前设备不支持语音播报。');
      }
    } catch (error) {
      setMessage(`API 语音失败：${error.message || '未知错误'}`);
    } finally {
      setBusy(false);
    }
  };

  const buttonStyle = (color) => ({
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
    padding: '7px 9px', borderRadius: '9px', color, background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${color}55`, cursor: busy ? 'wait' : 'pointer', fontSize: '0.68rem',
    whiteSpace: 'nowrap', opacity: busy ? 0.7 : 1,
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
      <button type="button" onClick={toggleRecording} disabled={busy} style={buttonStyle(recording ? '#f87171' : accentColor)} title={recording ? '结束录音并识别' : '语音输入'}>
        {busy ? <LoaderCircle size={14} className="spin-slow" /> : recording ? <MicOff size={14} /> : <Mic size={14} />}
        {recording ? '结束录音' : '语音输入'}
      </button>
      <button type="button" onClick={speak} disabled={busy} style={buttonStyle('#c4b5fd')} title={aiService.getVoiceApiKey() ? '使用 API 语音播报' : '使用设备语音；配置语音 API 后可切换 API 播报'}>
        <Volume2 size={14} /> {aiService.getVoiceApiKey() ? 'API 播报' : '语音播报'}
      </button>
      {message && <span role="status" style={{ color: '#94a3b8', fontSize: '0.64rem', flexBasis: '100%' }}>{message}</span>}
    </div>
  );
};
