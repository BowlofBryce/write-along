import { useMemo, useState } from 'react';
import type { DependencyStatus, InstallerStep } from '../../../electron/types';

type Stage = 'welcome' | 'checks' | 'install' | 'provider' | 'ready';

export function OnboardingFlow({ onReady }: { onReady: () => void }): JSX.Element {
  const [stage, setStage] = useState<Stage>('welcome');
  const [deps, setDeps] = useState<DependencyStatus[]>([]);
  const [steps, setSteps] = useState<InstallerStep[]>([]);

  const missing = useMemo(() => deps.filter((d) => !d.installed), [deps]);

  async function runChecks(): Promise<void> {
    const result = await window.desktopAPI.checkDependencies();
    setDeps(result);
    setStage(result.every((d) => d.installed) ? 'provider' : 'install');
  }

  async function install(id: string): Promise<void> {
    const outcome = await window.desktopAPI.installDependency(id);
    setSteps((s) => [...s.filter((x) => x.id !== id), outcome]);
    await runChecks();
  }

  async function finish(): Promise<void> {
    await window.desktopAPI.setOnboardingComplete(true);
    onReady();
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-surface-950 via-slate-900 to-surface-900 text-slate-100 p-10">
      <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-black/20 backdrop-blur p-8 shadow-soft min-h-[82vh]">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome to Write Along</h1>
        <p className="mt-3 text-slate-300 max-w-2xl">A premium long-form writing studio with a living story intelligence partner.</p>

        {stage === 'welcome' && (
          <div className="mt-10 space-y-6">
            <p className="text-slate-300">We’ll prepare your Mac for local AI writing features before you start drafting.</p>
            <button className="btn-primary" onClick={() => setStage('checks')}>Start setup</button>
          </div>
        )}

        {stage === 'checks' && (
          <div className="mt-8">
            <button className="btn-primary" onClick={runChecks}>Run dependency check</button>
          </div>
        )}

        {stage === 'install' && (
          <div className="mt-8 grid gap-4">
            {deps.map((dep) => (
              <div key={dep.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex justify-between items-start gap-4">
                <div>
                  <div className="font-medium">{dep.name}</div>
                  <div className="text-sm text-slate-300">{dep.purpose}</div>
                  <div className="text-xs text-slate-400 mt-1">{dep.installed ? dep.details ?? 'Installed' : dep.installHint}</div>
                </div>
                <div>
                  {dep.installed ? (
                    <span className="text-emerald-300 text-sm">Installed</span>
                  ) : (
                    <button className="btn-secondary" onClick={() => install(dep.id)}>Install</button>
                  )}
                </div>
              </div>
            ))}
            {steps.length > 0 && (
              <div className="rounded-xl bg-black/40 p-4 text-xs font-mono max-h-36 overflow-auto">
                {steps.map((s) => (
                  <div key={s.id}>{s.label}: {s.status} — {s.logs.join(' ')}</div>
                ))}
              </div>
            )}
            {missing.length === 0 && <button className="btn-primary" onClick={() => setStage('provider')}>Continue</button>}
          </div>
        )}

        {stage === 'provider' && (
          <div className="mt-10 space-y-4 max-w-2xl">
            <h2 className="text-xl font-semibold">Local AI Provider Setup</h2>
            <p className="text-slate-300">Write Along is configured for local runtime usage with Ollama. You can switch providers later in Settings.</p>
            <div className="rounded-xl border border-white/10 p-4 bg-white/5 text-sm text-slate-300">Default model path: ~/Library/Application Support/Write Along/models</div>
            <button className="btn-primary" onClick={() => setStage('ready')}>Looks good</button>
          </div>
        )}

        {stage === 'ready' && (
          <div className="mt-12 space-y-5">
            <h2 className="text-2xl font-semibold">You’re ready to write.</h2>
            <p className="text-slate-300">Your environment is prepared and Write Along can now open your drafting workspace.</p>
            <button className="btn-primary" onClick={finish}>Launch workspace</button>
          </div>
        )}
      </div>
    </div>
  );
}
