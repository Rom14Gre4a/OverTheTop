"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { useTheme } from "@/context/ThemeContext";
import { THEMES } from "@/lib/theme";

const NAV = [
  { href: "/dashboard",   icon: "⊞",  label: "Дашборд"    },
  { href: "/graph",       icon: "🕸",  label: "Граф"        },
  { href: "/training",    icon: "⚡",  label: "Тренування"  },
  { href: "/tournaments", icon: "🏆",  label: "Турніри"     },
  { href: "/analytics",   icon: "📊",  label: "Аналітика"   },
  { href: "/almanac",     icon: "📖",  label: "Альманах"    },
  { href: "/profile",     icon: "◉",   label: "Профіль"     },
  { href: "/settings",    icon: "⚙",   label: "Налаштування"},
  { href: "/admin",       icon: "⬡",   label: "Адмін"       },
];

export function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const { theme } = useTheme();
  const ac        = THEMES[theme].accent;

  const handleLogout = () => { logout(); router.push("/"); };

  return (
    <aside style={{
      position: "sticky", top: 0, height: "100vh", width: 220, flexShrink: 0,
      zIndex: 40, display: "flex", flexDirection: "column",
      background: "#090a0a",
      borderRight: "1px solid #1e2022",
      overflowY: "auto",
    }}>

      {/* Logo */}
      <div style={{
        padding: "18px 16px 14px",
        borderBottom: "1px solid #141618",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34,
            background: "#0f1214",
            border: "1px solid #2a2e32",
            clipPath: "polygon(6px 0%,100% 0%,100% calc(100% - 6px),calc(100% - 6px) 100%,0% 100%,0% 6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "var(--fz-body)",
          }}>💪</div>
          <div>
            <div style={{ color: ac, fontSize: "var(--fz-sm)", fontWeight: 900, letterSpacing: 0.5, lineHeight: 1 }}>
              OVERTHETOP
            </div>
            <div style={{ color: "#2a2e32", fontSize: "var(--fz-micro)", letterSpacing: 1.5, marginTop: 3 }}>
              ПЛАТФОРМА
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: "8px 0", overflowY: "auto", display: "flex", flexDirection: "column" }}>
        {NAV.map(({ href, icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 16px 9px 18px",
                textDecoration: "none", position: "relative",
                color: active ? "#f4f4f5" : "#3a3e42",
                fontSize: "var(--fz-xs)", fontWeight: 700,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                transition: "color 0.15s",
                borderLeft: active ? `2px solid ${ac}` : "2px solid transparent",
                background: active ? "rgba(255,255,255,0.03)" : "transparent",
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "#8a8e92";
                  (e.currentTarget as HTMLElement).style.borderLeftColor = "#2a2e32";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.color = "#3a3e42";
                  (e.currentTarget as HTMLElement).style.borderLeftColor = "transparent";
                }
              }}
            >
              <span style={{ fontSize: "var(--fz-sm)", width: 16, textAlign: "center", flexShrink: 0, opacity: active ? 1 : 0.6 }}>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: "1px solid #141618" }}>
        {/* Profile strip */}
        <div style={{
          padding: "12px 14px",
          borderBottom: "1px solid #141618",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, flexShrink: 0,
            background: "#0f1214",
            border: "1px solid #2a2e32",
            clipPath: "polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "var(--fz-body)",
          }}>💪</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#c0c4c8", fontSize: "var(--fz-xs)", fontWeight: 700, lineHeight: 1 }}>АрмАтлет</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
              <div style={{ flex: 1, height: 2, background: "#1a1e22", borderRadius: 1 }}>
                <div style={{ height: "100%", width: "62%", background: ac, borderRadius: 1 }} />
              </div>
              <span style={{ color: ac, fontSize: "var(--fz-micro)", fontWeight: 800, letterSpacing: 0.3 }}>LVL 42</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: "10px 12px", display: "flex", gap: 6, alignItems: "center" }}>
          <ThemeSwitcher />
          <button
            onClick={handleLogout}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              gap: 5, padding: "7px 0",
              background: "#0f1214", border: "1px solid #1e2226",
              color: "#3a3e42", fontSize: "var(--fz-xs)", fontWeight: 700,
              letterSpacing: 0.5, cursor: "pointer", transition: "all 0.15s",
              clipPath: "polygon(5px 0%,100% 0%,100% calc(100% - 5px),calc(100% - 5px) 100%,0% 100%,0% 5px)",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.borderColor = "#ef444430";
              e.currentTarget.style.background = "#1a0a0a";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = "#3a3e42";
              e.currentTarget.style.borderColor = "#1e2226";
              e.currentTarget.style.background = "#0f1214";
            }}
          >
            ⏻ ВИЙТИ
          </button>
        </div>
      </div>
    </aside>
  );
}
