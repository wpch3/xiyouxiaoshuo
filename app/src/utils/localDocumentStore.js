const DB_NAME = 'ai-token-pet-local-data';
const DB_VERSION = 1;
const DOCUMENTS_STORE = 'documents';

const openDatabase = () => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) {
    reject(new Error('此运行环境不支持本机文件资料库（IndexedDB）'));
    return;
  }
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(DOCUMENTS_STORE)) {
      db.createObjectStore(DOCUMENTS_STORE, { keyPath: 'id' });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error || new Error('无法打开本机资料库'));
});

const withStore = async (mode, action) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DOCUMENTS_STORE, mode);
    const store = transaction.objectStore(DOCUMENTS_STORE);
    let result;
    try {
      result = action(store);
    } catch (error) {
      db.close();
      reject(error);
      return;
    }
    transaction.oncomplete = () => {
      db.close();
      resolve(result?.result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error('本机资料库操作失败'));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error || new Error('本机资料库操作已取消'));
    };
  });
};

const isTextFile = (file) => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  return file.type.startsWith('text/') || [
    'txt', 'md', 'markdown', 'json', 'csv', 'tsv', 'log', 'xml', 'yaml', 'yml',
    'js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'sql', 'sh', 'toml', 'ini',
  ].includes(extension);
};

export const listLocalDocuments = async () => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DOCUMENTS_STORE, 'readonly');
    const request = transaction.objectStore(DOCUMENTS_STORE).getAll();
    request.onsuccess = () => {
      db.close();
      resolve((request.result || []).sort((a, b) => b.addedAt.localeCompare(a.addedAt)));
    };
    request.onerror = () => {
      db.close();
      reject(request.error || new Error('无法读取本机资料'));
    };
  });
};

export const saveLocalDocument = async (file) => {
  if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} 超过 25 MB，暂不保存`);
  const textContent = isTextFile(file) && file.size <= 2 * 1024 * 1024
    ? (await file.text()).slice(0, 100_000)
    : '';
  const document = {
    id: globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    addedAt: new Date().toISOString(),
    textContent,
    blob: file.slice(0, file.size, file.type || 'application/octet-stream'),
    includeInContext: false,
  };
  await withStore('readwrite', (store) => store.put(document));
  return document;
};

export const updateLocalDocument = async (document) => {
  await withStore('readwrite', (store) => store.put(document));
};

export const deleteLocalDocument = async (id) => {
  await withStore('readwrite', (store) => store.delete(id));
};

export const downloadLocalDocument = (document) => {
  if (!document?.blob) return;
  const url = URL.createObjectURL(document.blob);
  const anchor = window.document.createElement('a');
  anchor.href = url;
  anchor.download = document.name || 'document';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
