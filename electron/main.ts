import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { loadProjects, loadSetting, saveProject, saveSetting } from './db';
import type { DependencyStatus, InstallerStep } from './types';

const execAsync = promisify(exec);
const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
let mainWindow: BrowserWindow | null = null;

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

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL as string);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());

ipcMain.handle('onboarding:check', checkDependencies);
ipcMain.handle('onboarding:install', (_, id: string) => installDependency(id));
ipcMain.handle('onboarding:set-complete', (_, value: boolean) => saveSetting('onboardingComplete', JSON.stringify(value)));
ipcMain.handle('onboarding:get-complete', () => loadSetting('onboardingComplete') ?? 'false');

ipcMain.handle('projects:list', () => loadProjects());
ipcMain.handle('projects:save', (_, payload: { id: string; title: string; data: string }) => saveProject(payload.id, payload.title, payload.data));
ipcMain.handle('settings:get', (_, key: string) => loadSetting(key));
ipcMain.handle('settings:set', (_, payload: { key: string; value: string }) => saveSetting(payload.key, payload.value));
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
