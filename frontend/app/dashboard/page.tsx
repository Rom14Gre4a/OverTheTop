"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const STATS = [
  { label: "Тренувань цього місяця", value: "0", sub: "сесій" },
  { label: "Турнірів",               value: "0", sub: "участей" },
  { label: "Перемог",                value: "0", sub: "загалом" },
  { label: "Поточна вага",           value: "—", sub: "кг"      },
];

export default function DashboardPage() {
  const router  = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) router.push("/login");
    else setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />

      <main className="flex-1 ml-56 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Дашборд</h1>
          <p className="text-muted text-sm mt-1">Ласкаво просимо назад 👊</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {STATS.map(s => (
            <Card key={s.label}>
              <p className="text-muted text-xs uppercase tracking-wide mb-2">{s.label}</p>
              <p className="text-4xl font-bold text-foreground" style={{ color: "var(--accent)" }}>
                {s.value}
              </p>
              <p className="text-muted text-xs mt-1">{s.sub}</p>
            </Card>
          ))}
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-3 gap-4">

          {/* Recent training */}
          <div className="col-span-2">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Останні тренування</h2>
                <Badge variant="neutral">Скоро</Badge>
              </div>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-3">⚡</span>
                <p className="text-muted text-sm">Тренувань ще немає</p>
                <p className="text-muted text-xs mt-1">Додай перше тренування щоб бачити прогрес</p>
              </div>
            </Card>
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            <Card>
              <h2 className="font-semibold text-foreground mb-4">Швидкі дії</h2>
              <div className="space-y-2">
                <QuickAction icon="⚡" label="Додати тренування" href="/training/new" />
                <QuickAction icon="🏆" label="Переглянути турніри" href="/tournaments" />
                <QuickAction icon="◉"  label="Мій профіль" href="/profile" />
              </div>
            </Card>

            <Card>
              <h2 className="font-semibold text-foreground mb-3">Найближчий турнір</h2>
              <div className="text-center py-6">
                <span className="text-3xl mb-2 block">🏆</span>
                <p className="text-muted text-xs">Турнірів не заплановано</p>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function QuickAction({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <a href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted
        hover:text-foreground hover:bg-[var(--surface-hover)] hover:border-[var(--accent)]/30
        border border-transparent transition-all duration-200 group">
      <span className="text-base group-hover:text-[var(--accent)] transition">{icon}</span>
      {label}
    </a>
  );
}
