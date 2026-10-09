import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Mic, MicOff } from 'lucide-react';
import { aiService } from '../utils/aiService';

// Transitional single-turn dictation control. This is intentionally not labeled
// as a live voice-chat mode; full duplex conversation needs a Realtime API.
export const VoiceChatControls = ({ onTranscript = () => {}, accentColor = '#60A5FA' }) => {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const speechRecognitionRef = useRef(null);

  useEffect(() => () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    speechRecognitionRef.current?.stop?.();
  }, []);

  const startBrowserRecognition = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setMessage('当前浏览器没有语音识别能力。');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) onTranscript(transcript);
      setMessage(transcript ? '识别完成，文字已放入输入框。' : '没有识别到语音。');
    };
    recognition.onerror = (event) => setMessage(`语音识别失败：${event.error || '未知错误'}`);
    recognition.onend = () => {
      setRecording(false);
      speechRecognitionRef.current = null;
    };
    speechRecognitionRef.current = recognition;
    setRecording(true);
    setMessage('正在听取单次语音输入…');
    recognition.start();
  };

  const transcribeRecording = async (blob) => {
    setBusy(true);
    setMessage('正在调用语音转写 API…');
    try {
      const transcript = await aiService.transcribeAudio(blob);
      if (transcript) onTranscript(transcript);
      setMessage(transcript ? '识别完成，文字已放入输入框。' : '没有识别到语音。');
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

    if (!aiService.getVoiceApiKey() || !navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
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
      setMessage('正在录音；结束后会转成文字，不会进行实时语音对话。');
    } catch (error) {
      setMessage(`无法打开麦克风：${error.message || '请检查麦克风权限'}`);
      startBrowserRecognition();
    }
  };

  const buttonStyle = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
    padding: '7px 9px', borderRadius: '9px', color: recording ? '#f87171' : accentColor,
    background: 'rgba(255,255,255,0.05)', border: `1px solid ${(recording ? '#f87171' : accentColor)}55`,
    cursor: busy ? 'wait' : 'pointer', fontSize: '0.68rem', whiteSpace: 'nowrap', opacity: busy ? 0.7 : 1,
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
      <button type="button" onClick={toggleRecording} disabled={busy} style={buttonStyle} title="单次语音转文字；不是实时语音通话">
        {busy ? <LoaderCircle size={14} className="spin-slow" /> : recording ? <MicOff size={14} /> : <Mic size={14} />}
        {recording ? '停止并转写' : '语音转文字'}
      </button>
      {message && <span role="status" style={{ color: '#94a3b8', fontSize: '0.64rem', flexBasis: '100%' }}>{message}</span>}
    </div>
  );
};
