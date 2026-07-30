const STORAGE_KEYS = {
  INBOX: 'inbox',
  COMPLETED: 'completed',
  CONFIG: 'config',
};
const LIST_PREFIX = 'list-';

function listKey(index) {
  return `${LIST_PREFIX}${index}`;
}

export function getListKey(index) {
  return listKey(index);
}

export const storageKeys = STORAGE_KEYS;

function getAPI() {
  if (typeof window !== 'undefined' && window.todotoday) return window.todotoday;
  return null;
}

export async function readInbox() {
  const api = getAPI();
  if (!api) return getDefaultInbox();
  const data = await api.storage.read(STORAGE_KEYS.INBOX);
  return data || getDefaultInbox();
}

export async function writeInbox(data) {
  const api = getAPI();
  if (!api) return;
  await api.storage.write(STORAGE_KEYS.INBOX, data);
}

export async function readList(index) {
  const api = getAPI();
  const key = listKey(index);
  if (!api) return getDefaultList(index);
  const data = await api.storage.read(key);
  return data || getDefaultList(index);
}

export async function writeList(index, data) {
  const api = getAPI();
  if (!api) return;
  await api.storage.write(listKey(index), data);
}

export async function readCompleted() {
  const api = getAPI();
  if (!api) return [];
  const data = await api.storage.read(STORAGE_KEYS.COMPLETED);
  return Array.isArray(data) ? data : [];
}

export async function writeCompleted(data) {
  const api = getAPI();
  if (!api) return;
  await api.storage.write(STORAGE_KEYS.COMPLETED, data);
}

export function onStorageExternalChange(callback) {
  const api = getAPI();
  if (!api || !api.onStorageExternalChange) return;
  api.onStorageExternalChange(callback);
}

export async function getDataPath() {
  const api = getAPI();
  if (!api) return '';
  return api.storage.getDataPath();
}

export async function readConfig() {
  const api = getAPI();
  if (!api) return { listsOrder: [] };
  const data = await api.storage.read(STORAGE_KEYS.CONFIG);
  const order = data?.listsOrder;
  return { listsOrder: Array.isArray(order) ? order : [] };
}

export async function writeConfig(data) {
  const api = getAPI();
  if (!api) return;
  await api.storage.write(STORAGE_KEYS.CONFIG, data);
}

function getDefaultInbox() {
  return { tasks: [] };
}

function getDefaultList(index) {
  return { name: '', tasks: [] };
}

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
