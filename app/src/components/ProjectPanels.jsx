import React, { useEffect, useState } from 'react';
import { Check, Download, FilePlus2, FolderOpen, Link2, Play, Plus, RefreshCw, Send, Trash2, Users, WandSparkles, X } from 'lucide-react';
import { aiService } from '../utils/aiService';
import {
  deleteLocalDocument,
  downloadLocalDocument,
  listLocalDocuments,
  saveLocalDocument,
  updateLocalDocument,
} from '../utils/localDocumentStore';

const panelStyle = {
  background: 'rgba(255,255,255,0.025)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '18px',
};
const inputStyle = {
  width: '100%', padding: '9px 11px', borderRadius: '9px',
  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(0,0,0,0.28)',
  color: '#f8fafc', outline: 'none', fontSize: '0.82rem',
};
const primaryButtonStyle = (color = '#3b82f6') => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  padding: '8px 12px', border: `1px solid ${color}75`, borderRadius: '9px',
  color: '#fff', background: `${color}35`, cursor: 'pointer', fontSize: '0.78rem',
});

const safeRead = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const localDocumentContext = (documents = []) => documents
  .filter((document) => document.includeInContext && document.textContent)
  .map((document) => `【本机资料：${document.name}】\n${document.textContent}`)
  .join('\n\n')
  .slice(0, 50_000);

const formatBytes = (bytes = 0) => bytes < 1024 * 1024
  ? `${(bytes / 1024).toFixed(1)} KB`
  : `${(bytes / 1024 / 1024).toFixed(2)} MB`;

export const WorkspacePanel = ({ character, provider, documents = [], isChatBusy = false, onOpenSettings = () => {}, onSend = () => {}, onUsage = () => {} }) => {
  const [task, setTask] = useState('');
  const [topics, setTopics] = useState(['今天先完成哪件最重要的事？', '帮我把一个复杂任务拆成清晰步骤', '陪我复盘今天的灵感']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const generateTopics = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await aiService.sendPrompt({
        provider,
        prompt: `请为桌宠对话生成 6 个简短、彼此不同的中文开场话题，适合 ${character.name} 的性格。每行一个，不要编号和解释。`,
        systemPrompt: '你是桌宠话题编辑器。只生成可直接点击发送的短话题。',
        onComplete: (usage) => onUsage(provider, '生成对话话题', usage),
      });
      const generated = result.fullText.split(/\n+/).map((line) => line.replace(/^\s*[-*\d.、)]+\s*/, '').trim()).filter(Boolean).slice(0, 8);
      if (generated.length) setTopics(generated);
      else setError('API 返回内容里没有可用的话题。');
    } catch (requestError) {
      setError(requestError.message || '话题生成失败；请检查 API 配置。');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '5px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><WandSparkles size={16} /> API 工作区</span></h3>
            <p style={{ color: '#94a3b8', fontSize: '0.76rem', lineHeight: 1.5 }}>
              当前：{character.name} · {character.modelFamily}。选中的本机资料可作为上下文；生成话题或执行任务会调用当前角色 API。
            </p>
          </div>
          <button type="button" onClick={onOpenSettings} style={primaryButtonStyle(character.color)}>打开 API 配置</button>
        </div>
        <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', fontSize: '0.75rem' }}>资料上下文：{documents.filter((doc) => doc.includeInContext && doc.textContent).length} 个文本文件</div>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', fontSize: '0.75rem' }}>API 失败时：显示实际错误，不切换成虚构答案</div>
          <div style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', color: '#cbd5e1', fontSize: '0.75rem' }}>对话与用量：保存在当前设备</div>
        </div>
      </section>

      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <div>
            <h3 style={{ color: '#f8fafc', fontSize: '0.92rem' }}>话题制造选项</h3>
            <p style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '3px' }}>可用预设话题，或让当前 API 生成新话题。</p>
          </div>
          <button type="button" onClick={generateTopics} disabled={busy} style={primaryButtonStyle(character.color)}>
            {busy ? <RefreshCw size={14} className="spin-slow" /> : <WandSparkles size={14} />} 生成话题
          </button>
        </div>
        {error && <p role="alert" style={{ color: '#fca5a5', fontSize: '0.72rem', marginBottom: '8px' }}>{error}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {topics.map((topic, index) => (
            <button key={`${index}-${topic}`} type="button" disabled={isChatBusy} onClick={() => onSend(topic)} style={{ ...primaryButtonStyle(character.color), background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)', color: '#dbeafe', opacity: isChatBusy ? 0.55 : 1 }}>{topic}</button>
          ))}
        </div>
      </section>

      <section style={panelStyle}>
        <h3 style={{ color: '#f8fafc', fontSize: '0.92rem', marginBottom: '8px' }}>任务输入</h3>
        <textarea value={task} onChange={(event) => setTask(event.target.value)} rows={4} placeholder="写下要处理的问题、研究任务或代码需求…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '9px' }}>
          <span style={{ color: '#64748b', fontSize: '0.68rem' }}>发送后会进入左侧与角色的本地对话记录。</span>
          <button type="button" disabled={!task.trim() || busy || isChatBusy} onClick={() => { onSend(task); setTask(''); }} style={{ ...primaryButtonStyle(character.color), opacity: isChatBusy ? 0.55 : 1 }}><Send size={14} /> {isChatBusy ? '对话处理中…' : `发给 ${character.name.split(' ')[0]}`}</button>
        </div>
      </section>
    </div>
  );
};

export const LibraryPanel = ({ documents, setDocuments, accentColor = '#60A5FA' }) => {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = async () => setDocuments(await listLocalDocuments());
  useEffect(() => { refresh().catch((error) => setMessage(error.message)); }, []);

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setWorking(true);
    setMessage('正在保存到本机资料库…');
    try {
      for (const file of files) await saveLocalDocument(file);
      await refresh();
      setMessage(`已保存 ${files.length} 个文件，仅存于本机。`);
    } catch (error) {
      setMessage(error.message || '保存文件失败');
    } finally {
      setWorking(false);
    }
  };

  const toggleContext = async (document) => {
    const updated = { ...document, includeInContext: !document.includeInContext };
    await updateLocalDocument(updated);
    setDocuments((prev) => prev.map((item) => item.id === updated.id ? updated : item));
  };

  const remove = async (document) => {
    if (!window.confirm(`从本机资料库删除“${document.name}”？`)) return;
    await deleteLocalDocument(document.id);
    setDocuments((prev) => prev.filter((item) => item.id !== document.id));
    setMessage('文件已从本机资料库删除。');
  };

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '5px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><FolderOpen size={16} /> 文件保存区</span></h3>
            <p style={{ color: '#94a3b8', fontSize: '0.74rem', lineHeight: 1.5 }}>文件保存在本机 IndexedDB，不会自动上传。TXT/MD/代码等文本可勾选后作为对话/Agent 上下文（请求时会发送给当前 API，可能增加用量）；其他文件可本机下载保存。</p>
          </div>
          <label style={{ ...primaryButtonStyle(accentColor), cursor: working ? 'wait' : 'pointer' }}>
            <FilePlus2 size={15} /> {working ? '保存中…' : '添加文件'}
            <input type="file" multiple onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} style={{ display: 'none' }} />
          </label>
        </div>
        {message && <p role="status" style={{ color: '#94a3b8', fontSize: '0.72rem', marginTop: '10px' }}>{message}</p>}
      </section>
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem', marginBottom: '8px' }}><span>本机文件：{documents.length}</span><span>上下文文件单个最多读取 100,000 字符</span></div>
        {documents.length === 0 ? <p style={{ color: '#64748b', fontSize: '0.78rem', padding: '14px 0' }}>还没有保存文件。</p> : (
          <div style={{ display: 'grid', gap: '8px' }}>
            {documents.map((document) => (
              <div key={document.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '8px', alignItems: 'center', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.035)' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#e2e8f0', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{document.name}</div>
                  <div style={{ color: '#64748b', fontSize: '0.65rem', marginTop: '3px' }}>{formatBytes(document.size)} · {document.textContent ? `${document.textContent.length.toLocaleString()} 字文本` : '二进制文件/暂不提取文本'}</div>
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {!!document.textContent && <button type="button" onClick={() => toggleContext(document)} style={{ ...primaryButtonStyle(document.includeInContext ? accentColor : '#64748b'), padding: '6px 8px', fontSize: '0.66rem' }}>{document.includeInContext ? '已进上下文' : '用于上下文'}</button>}
                  <button type="button" onClick={() => downloadLocalDocument(document)} title="下载副本" style={{ ...primaryButtonStyle('#60a5fa'), padding: '6px 8px' }}><Download size={13} /></button>
                  <button type="button" onClick={() => remove(document)} title="删除本机文件" style={{ ...primaryButtonStyle('#f87171'), padding: '6px 8px' }}><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export const AgentPanel = ({ provider, character, characters, documents = [], onUsage = () => {} }) => {
  const [task, setTask] = useState('');
  const [result, setResult] = useState('');
  const [workspace, setWorkspace] = useState(() => safeRead('pet_agent_workspace', ''));
  const [readPaths, setReadPaths] = useState('');
  const [filePath, setFilePath] = useState('agent-output.md');
  const [command, setCommand] = useState('');
  const [commandOutput, setCommandOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const hasDesktopBridge = Boolean(window.pywebview?.api);

  const chooseWorkspace = async () => {
    if (!window.pywebview?.api?.choose_workspace) {
      setStatus('选择本机工作目录/读写文件/运行命令需要 Windows 桌面版。');
      return;
    }
    try {
      const selected = await window.pywebview.api.choose_workspace();
      if (selected) {
        setWorkspace(selected);
        localStorage.setItem('pet_agent_workspace', selected);
        setStatus('工作目录已授权给本机 Agent 工具。');
      }
    } catch (error) {
      setStatus(error.message || '选择工作目录失败');
    }
  };

  const readFiles = async () => {
    const paths = readPaths.split(/\r?\n/).map((path) => path.trim()).filter(Boolean);
    if (!window.pywebview?.api?.read_workspace_file || !paths.length) {
      setStatus('请先选本机工作目录，并输入相对文件路径（每行一个）。');
      return;
    }
    setBusy(true);
    try {
      const records = [];
      for (const path of paths.slice(0, 20)) {
        records.push(await window.pywebview.api.read_workspace_file(path));
      }
      setWorkspaceFiles(records.filter((record) => record?.ok));
      setStatus(`已读取 ${records.filter((record) => record?.ok).length} 个工作区文件。`);
    } catch (error) {
      setStatus(error.message || '读取文件失败');
    } finally {
      setBusy(false);
    }
  };

  const runTask = async () => {
    if (!task.trim() || busy) return;
    setBusy(true);
    setStatus('Agent 正在调用 API…');
    try {
      const savedContext = localDocumentContext(documents);
      const workspaceContext = workspaceFiles.map((record) => `【工作区文件：${record.path}】\n${record.content}`).join('\n\n').slice(0, 50_000);
      const prompt = `${task.trim()}\n\n${savedContext ? `\n本机资料上下文：\n${savedContext}` : ''}${workspaceContext ? `\n已读取的工作区文件：\n${workspaceContext}` : ''}`;
      const response = await aiService.sendPrompt({
        provider,
        prompt,
        systemPrompt: `你是 ${character.name} 的 Agent 工作区助手。先分析需求，再给出可检查的文件内容、操作步骤或命令建议。绝不声称已经写入或执行，除非收到工具执行结果。`,
        onComplete: (usage) => onUsage(provider, 'Agent 工作区任务', usage),
      });
      setResult(response.fullText);
      setStatus(`API 任务完成 · ${response.tokens} tokens（${response.usageSource === 'api' ? 'API usage' : '本地估算'}）。`);
    } catch (error) {
      setStatus(error.message || 'Agent API 调用失败');
    } finally {
      setBusy(false);
    }
  };

  const saveResult = async () => {
    if (!result || !filePath.trim()) return;
    if (!window.pywebview?.api?.write_workspace_file) {
      setStatus('写入本机项目文件需要 Windows 桌面版；可以先复制或下载结果。');
      return;
    }
    if (!window.confirm(`确认写入工作目录中的文件：${filePath}\n本次写入将覆盖同名文件。`)) return;
    try {
      const response = await window.pywebview.api.write_workspace_file(filePath, result);
      setStatus(response?.message || '文件已写入工作区。');
    } catch (error) {
      setStatus(error.message || '写入文件失败');
    }
  };

  const executeCommand = async () => {
    if (!command.trim() || !window.pywebview?.api?.run_workspace_command) {
      setStatus('运行命令需要先在 Windows 桌面版选择工作目录。');
      return;
    }
    if (!window.confirm(`即将从所选工作目录运行此命令：\n\n${command}\n\n只运行你确认过的命令。`)) return;
    setBusy(true);
    try {
      const response = await window.pywebview.api.run_workspace_command(command);
      setCommandOutput([response.stdout, response.stderr].filter(Boolean).join('\n') || `退出码：${response.returnCode}`);
      setStatus(`命令完成，退出码 ${response.returnCode}。`);
    } catch (error) {
      setStatus(error.message || '命令运行失败');
    } finally {
      setBusy(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    const url = URL.createObjectURL(new Blob([result], { type: 'text/markdown;charset=utf-8' }));
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = filePath.split(/[\\/]/).pop() || 'agent-output.md';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div><h3 style={{ color: '#f8fafc', fontSize: '1rem', marginBottom: '4px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Play size={16} /> Agent 工作区</span></h3><p style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Agent 可读取你指定的文件并把内容发送到当前 API（不要选择含密钥/密码的文件）；写入和命令都会显示目标并要求确认。</p></div>
          <button type="button" onClick={chooseWorkspace} style={primaryButtonStyle('#8b5cf6')}><FolderOpen size={14} />选择工作目录</button>
        </div>
        <div style={{ marginTop: '8px', color: workspace ? '#cbd5e1' : '#64748b', fontSize: '0.7rem', overflowWrap: 'anywhere' }}>{workspace || '尚未选择本机工作目录'}{!hasDesktopBridge && ' · 当前网页预览不开放本机命令/文件系统权限'}</div>
      </section>

      <section style={panelStyle}>
        <label style={{ display: 'block', color: '#cbd5e1', fontSize: '0.76rem', marginBottom: '5px' }}>要交给 Agent 的任务</label>
        <textarea value={task} onChange={(event) => setTask(event.target.value)} rows={5} placeholder="例如：分析当前项目结构，指出聊天接口为什么没有真正统计 usage，并给出修改方案。" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', marginTop: '9px' }}>
          <span style={{ color: '#64748b', fontSize: '0.68rem' }}>已选本机资料 {documents.filter((doc) => doc.includeInContext && doc.textContent).length} 个；已读取工作区文件 {workspaceFiles.length} 个</span>
          <button type="button" onClick={runTask} disabled={!task.trim() || busy} style={primaryButtonStyle('#8b5cf6')}><Play size={14} />{busy ? '处理中…' : '运行 Agent 任务'}</button>
        </div>
      </section>

      {result && <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
          <h4 style={{ color: '#f8fafc', fontSize: '0.82rem' }}>Agent 输出（预览）</h4>
          <div style={{ display: 'flex', gap: '6px' }}><button type="button" onClick={downloadResult} style={primaryButtonStyle('#60a5fa')}><Download size={13} />下载</button><button type="button" onClick={saveResult} style={primaryButtonStyle('#34d399')}>写入工作区</button></div>
        </div>
        <textarea readOnly value={result} rows={12} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'ui-monospace, monospace', lineHeight: 1.5 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '7px', marginTop: '8px' }}><input value={filePath} onChange={(event) => setFilePath(event.target.value)} placeholder="相对路径，例如 docs/agent-report.md" style={inputStyle} /><span style={{ alignSelf: 'center', color: '#64748b', fontSize: '0.67rem' }}>写入前确认</span></div>
      </section>}

      <section style={panelStyle}>
        <h4 style={{ color: '#f8fafc', fontSize: '0.82rem', marginBottom: '7px' }}>读取工作区文件</h4>
        <textarea value={readPaths} onChange={(event) => setReadPaths(event.target.value)} rows={2} placeholder="相对路径，每行一个，例如 README.md" style={{ ...inputStyle, resize: 'vertical' }} />
        <button type="button" onClick={readFiles} disabled={busy} style={{ ...primaryButtonStyle('#60a5fa'), marginTop: '7px' }}>读取所列文件</button>
        {workspaceFiles.length > 0 && <div style={{ marginTop: '8px', color: '#94a3b8', fontSize: '0.68rem' }}>{workspaceFiles.map((file) => file.path).join(' · ')}</div>}
      </section>

      <section style={panelStyle}>
        <h4 style={{ color: '#f8fafc', fontSize: '0.82rem', marginBottom: '7px' }}>运行命令</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '7px' }}><input value={command} onChange={(event) => setCommand(event.target.value)} placeholder="输入要运行的命令；每次都要确认" style={inputStyle} /><button type="button" onClick={executeCommand} disabled={busy || !command.trim()} style={primaryButtonStyle('#f59e0b')}>确认并运行</button></div>
        {commandOutput && <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', color: '#cbd5e1', background: 'rgba(0,0,0,0.32)', padding: '10px', borderRadius: '9px', marginTop: '8px', fontSize: '0.68rem' }}>{commandOutput}</pre>}
      </section>
      {status && <p role="status" style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{status}</p>}
    </div>
  );
};

export const SocialPanel = ({ characters, onUsage = () => {} }) => {
  const [participants, setParticipants] = useState(() => {
    const saved = safeRead('pet_social_participants_v1', ['deepseek', 'claude', 'openai']);
    return Array.isArray(saved) ? saved.filter((id) => characters[id]).slice(0, 4) : ['deepseek', 'claude', 'openai'];
  });
  const [messages, setMessages] = useState(() => safeRead('pet_social_messages_v1', []));
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => { localStorage.setItem('pet_social_participants_v1', JSON.stringify(participants)); }, [participants]);
  useEffect(() => { localStorage.setItem('pet_social_messages_v1', JSON.stringify(messages.slice(-150))); }, [messages]);

  const toggleParticipant = (id) => setParticipants((prev) => {
    if (prev.includes(id)) return prev.length > 1 ? prev.filter((item) => item !== id) : prev;
    return prev.length < 4 ? [...prev, id] : prev;
  });

  const sendToGroup = async () => {
    const prompt = input.trim();
    if (!prompt || busy) return;
    const selectedParticipants = participants.filter((id) => characters[id]);
    if (!selectedParticipants.length) {
      setStatus('请至少选择一个参与群聊的角色。');
      return;
    }
    if (selectedParticipants.length > 1 && !window.confirm(`本轮将依次调用 ${selectedParticipants.length} 个角色的 API，可能产生多笔费用。是否继续？`)) return;
    const userMessage = { id: `social-${Date.now()}`, role: 'user', content: prompt, createdAt: new Date().toISOString() };
    const conversation = [...messages.filter((message) => !message.failed), userMessage];
    setMessages((items) => [...items, userMessage].slice(-150));
    setInput('');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000);
    let timedOut = false;
    setBusy(true);
    setStatus(`群聊开始：${selectedParticipants.length} 个角色将依次回应；后续角色会看到前面的回复。`);

    try {
      for (let index = 0; index < selectedParticipants.length; index += 1) {
        const id = selectedParticipants[index];
        const character = characters[id];
        if (!character) continue;
        setStatus(`正在等待 ${character.name} 回复（${index + 1}/${selectedParticipants.length}）…`);
        const recent = conversation.slice(-20).map((item) => ({
          role: item.role === 'user' ? 'user' : 'assistant',
          content: item.role === 'user' ? item.content : `${characters[item.characterId]?.name || '角色'}：${item.content}`,
        }));
        try {
          const response = await aiService.sendPrompt({
            provider: id,
            messages: recent,
            systemPrompt: `你是 ${character.name}，个性：${character.voiceStyle}。你正在与其他桌宠角色和用户进行轻松、尊重的群聊。结合其他角色刚才说的话自然接话，也可以表达友好的角色关系或分歧；以角色身份回应，避免冒充真实用户。`,
            signal: controller.signal,
            onComplete: (usage) => onUsage(id, `桌宠群聊：${prompt.slice(0, 80)}`, usage),
          });
          const reply = { id: `social-${Date.now()}-${id}`, role: 'character', characterId: id, content: response.fullText, tokens: response.tokens, usageSource: response.usageSource, createdAt: new Date().toISOString() };
          conversation.push(reply);
          setMessages((items) => [...items, reply].slice(-150));
        } catch (error) {
          if (controller.signal.aborted) {
            timedOut = true;
            break;
          }
          const failure = { id: `social-error-${Date.now()}-${id}`, role: 'character', characterId: id, failed: true, content: `API 调用失败：${error.message || '检查该角色的 API 配置。'}`, createdAt: new Date().toISOString() };
          setMessages((items) => [...items, failure].slice(-150));
        }
      }
    } finally {
      clearTimeout(timeoutId);
      setBusy(false);
      setStatus(timedOut ? '群聊等待超过 90 秒，已停止本轮并保留已有回复。' : '本轮角色回应结束。');
    }
  };

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <section style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Users size={18} color="#c084fc" /><h3 style={{ color: '#f8fafc', fontSize: '1rem' }}>角色社交 · 多桌宠群聊</h3></div>
        <p style={{ color: '#94a3b8', fontSize: '0.72rem', lineHeight: 1.5, marginTop: '6px' }}>这是本机角色群聊，不需要用户账号。所选角色会依次调用各自的 API；多选可能产生多笔 API 费用，发送前会提示确认。</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {Object.values(characters).map((character) => {
            const active = participants.includes(character.id);
            return <button key={character.id} type="button" disabled={busy} onClick={() => toggleParticipant(character.id)} style={{ ...primaryButtonStyle(active ? character.color : '#64748b'), padding: '6px 9px', opacity: busy ? 0.55 : participants.length >= 4 && !active ? 0.5 : 1 }}>{active && <Check size={13} aria-hidden="true" />}{character.name.split(' ')[0]}</button>;
          })}
        </div>
      </section>
      <section style={panelStyle}>
        <div style={{ height: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
          {messages.length === 0 ? <p style={{ margin: 'auto', color: '#64748b', fontSize: '0.75rem' }}>向角色群聊发送一个话题，角色会按照选择顺序回应。</p> : messages.slice(-40).map((message) => (
            <div key={message.id} style={{ alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%', padding: '9px 11px', borderRadius: '10px', background: message.role === 'user' ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.05)', color: message.failed ? '#fca5a5' : '#e2e8f0', fontSize: '0.74rem', lineHeight: 1.45, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {message.role === 'character' && <div style={{ color: characters[message.characterId]?.accentColor || '#c084fc', fontWeight: 700, marginBottom: '3px' }}>{characters[message.characterId]?.name}</div>}
              {message.content}
              {message.usageSource && <div style={{ color: '#64748b', marginTop: '4px', fontSize: '0.62rem' }}>{message.tokens} tokens · {message.usageSource === 'api' ? 'API usage' : '估算'}</div>}
            </div>
          ))}
        </div>
        <form onSubmit={(event) => { event.preventDefault(); sendToGroup(); }} style={{ display: 'flex', gap: '7px', marginTop: '10px' }}>
          <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="对角色们说点什么…" style={inputStyle} />
          <button type="submit" disabled={!input.trim() || busy} style={primaryButtonStyle('#c084fc')}><Send size={14} />{busy ? '群聊中…' : '发送'}</button>
        </form>
        <button type="button" onClick={() => { if (window.confirm('清除本机角色群聊记录？')) setMessages([]); }} style={{ marginTop: '8px', border: 0, background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '0.67rem' }}><Trash2 size={12} style={{ verticalAlign: 'middle' }} /> 清空群聊</button>
        {status && <span role="status" style={{ color: '#64748b', fontSize: '0.67rem', marginLeft: '10px' }}>{status}</span>}
      </section>
    </div>
  );
};

const DEFAULT_LINKS = [
  { id: 'project-repo', provider: 'GitHub', label: '本项目代码仓库', url: 'https://github.com/wpch3/xiyouxiaoshuo' },
  { id: 'github-home', provider: 'GitHub', label: 'GitHub', url: 'https://github.com/' },
  { id: 'google-drive', provider: '云盘', label: 'Google Drive', url: 'https://drive.google.com/' },
  { id: 'onedrive', provider: '云盘', label: 'OneDrive', url: 'https://onedrive.live.com/' },
  { id: 'dropbox', provider: '云盘', label: 'Dropbox', url: 'https://www.dropbox.com/' },
];

export const LinksPanel = () => {
  const [links, setLinks] = useState(() => safeRead('pet_external_links_v1', DEFAULT_LINKS));
  const [draft, setDraft] = useState({ provider: '云盘', label: '', url: '' });
  const [error, setError] = useState('');
  useEffect(() => { localStorage.setItem('pet_external_links_v1', JSON.stringify(links)); }, [links]);

  const addLink = (event) => {
    event.preventDefault();
    try {
      const parsed = new URL(draft.url);
      if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('只接受 http 或 https 链接');
      const newLink = { ...draft, id: `link-${Date.now()}`, url: parsed.toString() };
      setLinks((prev) => [newLink, ...prev]);
      setDraft({ provider: '云盘', label: '', url: '' });
      setError('');
    } catch {
      setError('请填写有效的 http/https 链接。');
    }
  };

  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <section style={panelStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Link2 size={18} color="#94a3b8" /><h3 style={{ color: '#f8fafc', fontSize: '1rem' }}>GitHub / 云端储存链接</h3></div>
        <p style={{ color: '#94a3b8', fontSize: '0.72rem', lineHeight: 1.5, marginTop: '6px' }}>这是本机保存的快捷链接区：打开你自己的仓库、共享文件夹或云盘目录；不会在未授权时登录或同步任何账户。</p>
      </section>
      <form onSubmit={addLink} style={{ ...panelStyle, display: 'grid', gridTemplateColumns: 'minmax(95px, 0.5fr) minmax(130px, 0.8fr) minmax(180px, 1.6fr) auto', gap: '8px', alignItems: 'end' }}>
        <label style={{ color: '#94a3b8', fontSize: '0.68rem' }}>类别<select value={draft.provider} onChange={(event) => setDraft({ ...draft, provider: event.target.value })} style={{ ...inputStyle, marginTop: '4px' }}><option>云盘</option><option>GitHub</option><option>其他</option></select></label>
        <label style={{ color: '#94a3b8', fontSize: '0.68rem' }}>名称<input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} required placeholder="共享文件夹" style={{ ...inputStyle, marginTop: '4px' }} /></label>
        <label style={{ color: '#94a3b8', fontSize: '0.68rem' }}>链接<input value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} required placeholder="https://…" style={{ ...inputStyle, marginTop: '4px' }} /></label>
        <button type="submit" style={primaryButtonStyle('#60a5fa')}><Plus size={14} />添加</button>
        {error && <span style={{ gridColumn: '1 / -1', color: '#fca5a5', fontSize: '0.7rem' }}>{error}</span>}
      </form>
      <section style={{ ...panelStyle, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '9px' }}>
        {links.map((link) => (
          <div key={link.id} style={{ padding: '12px', borderRadius: '11px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ color: '#64748b', fontSize: '0.66rem', marginBottom: '5px' }}>{link.provider}</div>
            <a href={link.url} target="_blank" rel="noreferrer" style={{ color: '#bfdbfe', fontSize: '0.8rem', textDecoration: 'none', overflowWrap: 'anywhere' }}><Link2 size={13} style={{ verticalAlign: 'middle', marginRight: '5px' }} />{link.label}</a>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '0.61rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.url}</span>
              <button type="button" onClick={() => setLinks((prev) => prev.filter((item) => item.id !== link.id))} title="移除此快捷链接" style={{ flex: '0 0 auto', border: 0, background: 'transparent', color: '#f87171', cursor: 'pointer' }}><X size={14} /></button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
