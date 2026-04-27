"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  trainingApi, type MacroperiodDto,
  GOAL_LABELS, STYLE_LABELS, MODE_LABELS, DAYS,
} from "@/lib/training";

export default function TrainingPage() {
  const router = useRouter();
  const [ready, setReady]       = useState(false);
  const [periods, setPeriods]   = useState<MacroperiodDto[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    setReady(true);
    trainingApi.getMacroperiods().then(setPeriods).finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Видалити макроперіод?")) return;
    await trainingApi.deleteMacroperiod(id);
    setPeriods(p => p.filter(x => x.id !== id));
  };

  if (!ready) return null;

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />
      <main className="flex-1 ml-56 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Тренування</h1>
            <p className="text-muted text-sm mt-1">Макроперіоди та тренувальні плани</p>
          </div>
          <Button onClick={() => router.push("/training/new")} glow>
            + Новий план
          </Button>
        </div>

        {loading ? (
          <div className="text-muted text-sm">Завантаження...</div>
        ) : periods.length === 0 ? (
          <EmptyState onNew={() => router.push("/training/new")} />
        ) : (
          <div className="space-y-4">
            {periods.map(p => <PeriodCard key={p.id} period={p} onDelete={handleDelete} />)}
          </div>
        )}
      </main>
    </div>
  );
}

function PeriodCard({ period, onDelete }: { period: MacroperiodDto; onDelete: (id: string) => void }) {
  const router = useRouter();
  const start  = new Date(period.startDate).toLocaleDateString("uk-UA");
  const end    = new Date(new Date(period.startDate).getTime() + period.weeksCount * 7 * 86400000)
                   .toLocaleDateString("uk-UA");

  return (
    <Card className="hover:border-[var(--accent)]/40 cursor-pointer transition-all"
      onClick={() => router.push(`/training/${period.id}`)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-semibold text-foreground text-lg">{period.name}</h2>
            <Badge variant="accent">{STYLE_LABELS[period.focusStyle]}</Badge>
          </div>
          <p className="text-muted text-sm mb-3">{GOAL_LABELS[period.goal]}</p>

          <div className="flex items-center gap-4 text-xs text-muted">
            <span>📅 {start} — {end}</span>
            <span>⏱ {period.weeksCount} тижнів</span>
          </div>

          {period.mesocycles.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {period.mesocycles.map((ms, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md text-xs glass border-[var(--border)] text-muted">
                  {ms.name} · {ms.durationWeeks}т
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={e => { e.stopPropagation(); onDelete(period.id); }}
          className="text-muted hover:text-red-400 transition p-2 rounded-lg hover:bg-red-500/10 ml-4"
        >✕</button>
      </div>
    </Card>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <Card className="text-center py-16">
      <div className="text-5xl mb-4">⚡</div>
      <h2 className="text-foreground font-semibold text-xl mb-2">Планів ще немає</h2>
      <p className="text-muted text-sm mb-6 max-w-sm mx-auto">
        Створи перший макроперіод — конструктор допоможе розбити його на фази, тижні і вправи.
      </p>
      <Button onClick={onNew} glow>Створити перший план</Button>
    </Card>
  );
}
