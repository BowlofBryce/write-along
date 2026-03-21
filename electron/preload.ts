import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('desktopAPI', {
  checkDependencies: () => ipcRenderer.invoke('onboarding:check'),
  installDependency: (id: string) => ipcRenderer.invoke('onboarding:install', id),
  setOnboardingComplete: (value: boolean) => ipcRenderer.invoke('onboarding:set-complete', value),
  getOnboardingComplete: () => ipcRenderer.invoke('onboarding:get-complete'),
  listProjects: () => ipcRenderer.invoke('projects:list'),
  saveProject: (payload: { id: string; title: string; data: string }) => ipcRenderer.invoke('projects:save', payload),
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  setSetting: (payload: { key: string; value: string }) => ipcRenderer.invoke('settings:set', payload),
  listAIModels: () => ipcRenderer.invoke('ai:list-models'),
  generateAI: (prompt: string) => ipcRenderer.invoke('ai:generate', prompt),
  exportManuscript: (content: string) => ipcRenderer.invoke('dialog:export', content),
});
