import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { loadProjects, loadSetting, saveProject, saveSetting } from './db';
import type { DependencyStatus, InstallerStep } from './types';

const execAsync = promisify(exec);
let mainWindow: BrowserWindow | null = null;
let logFilePath = '';

function formatLog(scope: string, message: string, extra?: unknown): string {
  const detail = extra === undefined ? '' : ` ${JSON.stringify(extra, null, 2)}`;
  return `[${new Date().toISOString()}][${scope}] ${message}${detail}`;
}

function writeLog(scope: string, message: string, extra?: unknown): void {
  const line = formatLog(scope, message, extra);
  process.stdout.write(`${line}\n`);
  console.log(line);
  if (!logFilePath) return;
  try {
    fs.appendFileSync(logFilePath, `${line}\n`, 'utf8');
  } catch (error) {
    console.error(formatLog('logger', 'failed to append to log file', error));
  }
}

const dependencies = [
  { id: 'homebrew', name: 'Homebrew', purpose: 'Installs local AI runtime tools', check: 'brew --version', installHint: 'Install from brew.sh' },
  { id: 'ollama', name: 'Ollama', purpose: 'Runs local language models privately on your Mac', check: 'ollama --version', installHint: 'brew install --cask ollama' },
  { id: 'git', name: 'Git', purpose: 'Supports project backups and integration workflows', check: 'git --version', installHint: 'xcode-select --install' },
];

async function checkDependencies(): Promise<DependencyStatus[]> {
  const appSupport = path.join(app.getPath('home'), 'Library', 'Application Support', 'Write Along');
  fs.mkdirSync(appSupport, { recursive: true });
  const modelDir = path.join(appSupport, 'models');
  const projectDir = path.join(appSupport, 'projects');
  fs.mkdirSync(modelDir, { recursive: true });
  fs.mkdirSync(projectDir, { recursive: true });

  const checks = await Promise.all(
    dependencies.map(async (dep) => {
      try {
        const result = await execAsync(dep.check);
        return { id: dep.id, name: dep.name, purpose: dep.purpose, installed: true, installHint: dep.installHint, details: (result.stdout || result.stderr).trim() };
      } catch {
        return { id: dep.id, name: dep.name, purpose: dep.purpose, installed: false, installHint: dep.installHint };
      }
    }),
  );

  checks.push({
    id: 'folders',
    name: 'App Support Folders',
    purpose: 'Stores projects, model configuration, and cache safely',
    installed: fs.existsSync(modelDir) && fs.existsSync(projectDir),
    installHint: 'Created automatically by Write Along',
    details: appSupport,
  });

  return checks;
}

async function installDependency(id: string): Promise<InstallerStep> {
  const step: InstallerStep = { id, label: `Install ${id}`, status: 'running', logs: [] };
  try {
    if (id === 'homebrew') {
      step.logs.push('Open brew.sh and run the official installer script.');
      await shell.openExternal('https://brew.sh');
      step.status = 'failed';
      step.logs.push('Automatic Homebrew install is not run without explicit user action.');
      return step;
    }
    if (id === 'ollama') {
      const { stdout, stderr } = await execAsync('brew install --cask ollama');
      step.logs.push(stdout, stderr);
      step.status = 'success';
      return step;
    }
    if (id === 'git') {
      const { stdout, stderr } = await execAsync('xcode-select --install');
      step.logs.push(stdout, stderr);
      step.status = 'success';
      return step;
    }
    step.status = 'failed';
    step.logs.push('Unknown dependency id');
    return step;
  } catch (error) {
    step.status = 'failed';
    step.logs.push((error as Error).message);
    return step;
  }
}

function createWindow(): void {
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  const isDev = !app.isPackaged && Boolean(devServerUrl);

  mainWindow = new BrowserWindow({
    width: 1680,
    height: 980,
    minWidth: 1280,
    minHeight: 760,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0B0F15',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.on('did-fail-load', (_, code, description, validatedUrl) => {
    writeLog('window', 'failed to load content', { code, description, validatedUrl });
    if (!isDev) {
      return;
    }

    const fallbackPath = path.join(__dirname, '../dist/index.html');
    writeLog('window', 'falling back to local index.html after dev-server load failure', { fallbackPath });
    mainWindow?.loadFile(fallbackPath);
  });
  mainWindow.webContents.on('render-process-gone', (_, details) => {
    writeLog('window', 'renderer process exited unexpectedly', details);
  });
  mainWindow.webContents.on('console-message', (_, level, message, line, sourceId) => {
    writeLog('renderer.console', message, { level, line, sourceId });
  });

  if (isDev) {
    writeLog('window', 'loading from vite dev server', { devServerUrl });
    mainWindow.loadURL(devServerUrl as string);
  } else {
    const filePath = path.join(__dirname, '../dist/index.html');
    writeLog('window', 'loading packaged renderer entry', { filePath });
    mainWindow.loadFile(filePath);
  }
}

app.whenReady().then(() => {
  logFilePath = path.join(app.getPath('userData'), 'write-along.log');
  writeLog('app', 'terminal logging enabled');
  writeLog('app', 'persistent log file path', { logFilePath });
  writeLog('app', 'application ready', {
    appVersion: app.getVersion(),
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
    platform: process.platform,
    packaged: app.isPackaged,
    userData: app.getPath('userData'),
  });
  createWindow();
});
app.on('window-all-closed', () => app.quit());
app.on('render-process-gone', (_, webContents, details) => {
  writeLog('app', 'render-process-gone event', { url: webContents.getURL(), details });
});
app.on('child-process-gone', (_, details) => {
  writeLog('app', 'child-process-gone event', details);
});

ipcMain.handle('onboarding:check', checkDependencies);
ipcMain.handle('onboarding:install', (_, id: string) => installDependency(id));
ipcMain.handle('onboarding:set-complete', (_, value: boolean) => saveSetting('onboardingComplete', JSON.stringify(value)));
ipcMain.handle('onboarding:get-complete', () => loadSetting('onboardingComplete') ?? 'false');

ipcMain.handle('projects:list', () => loadProjects());
ipcMain.handle('projects:save', (_, payload: { id: string; title: string; data: string }) => saveProject(payload.id, payload.title, payload.data));
ipcMain.handle('settings:get', (_, key: string) => loadSetting(key));
ipcMain.handle('settings:set', (_, payload: { key: string; value: string }) => saveSetting(payload.key, payload.value));
ipcMain.on('logs:renderer', (_, payload: { level: 'log' | 'warn' | 'error'; message: string; details?: unknown }) => {
  if (payload.level === 'error') {
    console.error(`[renderer] ${payload.message}`, payload.details);
  } else if (payload.level === 'warn') {
    console.warn(`[renderer] ${payload.message}`, payload.details);
  } else {
    console.log(`[renderer] ${payload.message}`, payload.details);
  }
  writeLog(`renderer.${payload.level}`, payload.message, payload.details);
});
ipcMain.handle('logs:path', () => logFilePath);
ipcMain.handle('ai:list-models', async () => {
  const baseUrl = (loadSetting('ai.baseUrl') ?? 'http://127.0.0.1:11434').replace(/\/$/, '');
  try {
    const response = await fetch(`${baseUrl}/api/tags`);
    if (!response.ok) return [];
    const payload = (await response.json()) as { models?: Array<{ name?: string }> };
    return (payload.models ?? []).map((m) => m.name).filter((name): name is string => Boolean(name));
  } catch {
    return [];
  }
});
ipcMain.handle('ai:generate', async (_, prompt: string) => {
  const model = loadSetting('ai.model') ?? 'llama3.2';
  const baseUrl = (loadSetting('ai.baseUrl') ?? 'http://127.0.0.1:11434').replace(/\/$/, '');
  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
      }),
    });
    if (!response.ok) return `AI call failed with status ${response.status}.`;
    const payload = (await response.json()) as { response?: string };
    return payload.response?.trim() || 'AI returned an empty response.';
  } catch {
    return `Unable to reach local AI runtime at ${baseUrl}. Confirm Ollama is running and model "${model}" is available.`;
  }
});
ipcMain.handle('dialog:export', async (_, content: string) => {
  if (!mainWindow) return { ok: false };
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Export manuscript',
    defaultPath: 'manuscript.md',
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  });
  if (result.canceled || !result.filePath) return { ok: false };
  fs.writeFileSync(result.filePath, content, 'utf8');
  return { ok: true, filePath: result.filePath };
});
