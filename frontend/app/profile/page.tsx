"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  getProfile,
  updateProfile,
  type AthleteProfile,
  type UpdateProfilePayload,
  GENDER_LABELS,
  HAND_LABELS,
  STYLE_LABELS,
  WEIGHT_CATEGORY_LABELS,
} from "@/lib/profile";

// ─── helpers ────────────────────────────────────────────────────────────────

function calcAge(dob?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatDob(dob?: string): string {
  if (!dob) return "—";
  return new Date(dob).toLocaleDateString("uk-UA", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── StatCard ───────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="text-xs text-muted mb-1">{label}</div>
      <div className="text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}

// ─── InfoRow ────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between py-3"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-foreground">{value || "—"}</span>
    </div>
  );
}

// ─── Field ──────────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-muted font-medium uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full h-9 px-3 rounded-lg text-sm text-foreground bg-transparent outline-none transition-colors";
const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.12)",
};
const inputFocusStyle = {
  background: "rgba(255,255,255,0.09)",
  border: "1px solid rgba(255,255,255,0.22)",
};

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      className={inputCls}
      style={focused ? inputFocusStyle : inputStyle}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

function SelectInput<T extends string>({
  value,
  onChange,
  options,
  placeholder = "—",
}: {
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      className={inputCls + " cursor-pointer"}
      style={focused ? inputFocusStyle : inputStyle}
      value={value ?? ""}
      onChange={(e) => onChange((e.target.value as T) || undefined)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ background: "#111113" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ─── Avatar ─────────────────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-black select-none"
      style={{
        background: "linear-gradient(140deg, var(--accent-light) 0%, var(--accent) 100%)",
        boxShadow: "0 0 0 4px rgba(255,255,255,0.08)",
      }}
    >
      {initials || "?"}
    </div>
  );
}

// ─── EditModal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  open: boolean;
  onClose: () => void;
  profile: AthleteProfile;
  onSave: (updated: AthleteProfile) => void;
}

function EditModal({ open, onClose, profile, onSave }: EditModalProps) {
  const [form, setForm] = useState<UpdateProfilePayload>({
    firstName: profile.firstName,
    lastName: profile.lastName,
    dateOfBirth: profile.dateOfBirth?.slice(0, 10),
    gender: profile.gender,
    weight: profile.weight,
    weightCategory: profile.weightCategory as UpdateProfilePayload["weightCategory"],
    preferredHand: profile.preferredHand,
    preferredStyle: profile.preferredStyle,
    country: profile.country ?? "",
    club: profile.club ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth?.slice(0, 10),
        gender: profile.gender,
        weight: profile.weight,
        weightCategory: profile.weightCategory as UpdateProfilePayload["weightCategory"],
        preferredHand: profile.preferredHand,
        preferredStyle: profile.preferredStyle,
        country: profile.country ?? "",
        club: profile.club ?? "",
      });
      setError("");
    }
  }, [open, profile]);

  const set = <K extends keyof UpdateProfilePayload>(key: K, value: UpdateProfilePayload[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Імʼя та прізвище обовʼязкові");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const updated = await updateProfile(form);
      onSave(updated);
      onClose();
    } catch {
      setError("Помилка збереження. Спробуй ще раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Редагування профілю" className="max-w-lg">
      <div className="flex flex-col gap-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Імʼя">
            <TextInput value={form.firstName} onChange={(v) => set("firstName", v)} placeholder="Імʼя" />
          </Field>
          <Field label="Прізвище">
            <TextInput value={form.lastName} onChange={(v) => set("lastName", v)} placeholder="Прізвище" />
          </Field>
        </div>

        {/* Bio row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Дата народження">
            <input
              type="date"
              className={inputCls}
              style={inputStyle}
              value={form.dateOfBirth ?? ""}
              onChange={(e) => set("dateOfBirth", e.target.value || undefined)}
            />
          </Field>
          <Field label="Стать">
            <SelectInput<"Male" | "Female">
              value={form.gender}
              onChange={(v) => set("gender", v)}
              options={[
                { value: "Male", label: "Чоловіча" },
                { value: "Female", label: "Жіноча" },
              ]}
            />
          </Field>
        </div>

        {/* Weight row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Вага (кг)">
            <input
              type="number"
              step="0.1"
              min="40"
              max="200"
              className={inputCls}
              style={inputStyle}
              value={form.weight ?? ""}
              onChange={(e) => set("weight", e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </Field>
          <Field label="Вагова категорія">
            <SelectInput
              value={form.weightCategory}
              onChange={(v) => set("weightCategory", v)}
              options={Object.entries(WEIGHT_CATEGORY_LABELS).map(([k, l]) => ({ value: k, label: l }))}
            />
          </Field>
        </div>

        {/* Arm row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Провідна рука">
            <SelectInput<"Left" | "Right" | "Both">
              value={form.preferredHand}
              onChange={(v) => set("preferredHand", v)}
              options={[
                { value: "Left",  label: "Ліва" },
                { value: "Right", label: "Права" },
                { value: "Both",  label: "Обидві" },
              ]}
            />
          </Field>
          <Field label="Стиль боротьби">
            <SelectInput<"TopRoll" | "Hook" | "Press" | "Tricep" | "Universal">
              value={form.preferredStyle}
              onChange={(v) => set("preferredStyle", v)}
              options={[
                { value: "TopRoll",   label: "Топ-рол" },
                { value: "Hook",      label: "Хук" },
                { value: "Press",     label: "Прес" },
                { value: "Tricep",    label: "Трицепс" },
                { value: "Universal", label: "Універсальний" },
              ]}
            />
          </Field>
        </div>

        {/* Location row */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Країна">
            <TextInput value={form.country ?? ""} onChange={(v) => set("country", v)} placeholder="Країна" />
          </Field>
          <Field label="Клуб">
            <TextInput value={form.club ?? ""} onChange={(v) => set("club", v)} placeholder="Клуб / секція" />
          </Field>
        </div>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="secondary" size="sm" className="flex-1" onClick={onClose} disabled={saving}>
            Скасувати
          </Button>
          <Button variant="primary" size="sm" className="flex-1" onClick={handleSave} disabled={saving}>
            {saving ? "Зберігаємо…" : "Зберегти"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) { router.push("/login"); return; }
    setReady(true);
    getProfile()
      .then(setProfile)
      .catch(() => setLoadError("Не вдалося завантажити профіль"))
      .finally(() => setLoading(false));
  }, [router]);

  if (!ready) return null;

  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : "";
  const age = calcAge(profile?.dateOfBirth);

  return (
    <div className="flex min-h-screen relative z-10">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Профіль</h1>
          <p className="text-muted text-sm mt-1">Особисті дані та налаштування атлета</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
          </div>
        )}

        {loadError && (
          <div className="rounded-xl p-6 text-center" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.22)" }}>
            <p className="text-red-400">{loadError}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => window.location.reload()}>
              Спробувати знову
            </Button>
          </div>
        )}

        {profile && (
          <div className="max-w-2xl flex flex-col gap-6">
            {/* Identity card */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "linear-gradient(170deg, #1c1c20 0%, #111113 100%)",
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            >
              <div className="flex items-center gap-6">
                <Avatar name={fullName} />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-foreground truncate">{fullName || "—"}</h2>
                  <p className="text-sm text-muted mt-0.5">{profile.email}</p>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {profile.weightCategory && (
                      <span
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                        style={{
                          background: "linear-gradient(160deg, var(--accent-light) 0%, var(--accent) 100%)",
                          color: "#000",
                        }}
                      >
                        {WEIGHT_CATEGORY_LABELS[profile.weightCategory] ?? profile.weightCategory}
                      </span>
                    )}
                    {profile.preferredStyle && (
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.08)", color: "var(--foreground)" }}
                      >
                        {STYLE_LABELS[profile.preferredStyle]}
                      </span>
                    )}
                    {profile.preferredHand && (
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-lg"
                        style={{ background: "rgba(255,255,255,0.08)", color: "var(--foreground)" }}
                      >
                        {HAND_LABELS[profile.preferredHand]}
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setEditOpen(true)}>
                  Редагувати
                </Button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="Вік" value={age != null ? `${age} р.` : "—"} />
              <StatCard label="Вага" value={profile.weight != null ? `${profile.weight} кг` : "—"} />
              <StatCard
                label="Країна"
                value={profile.country ?? "—"}
              />
            </div>

            {/* Details section */}
            <div
              className="rounded-2xl px-6 py-2"
              style={{
                background: "linear-gradient(170deg, #1c1c20 0%, #111113 100%)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest py-3"
                style={{ color: "var(--accent)" }}
              >
                Особисті дані
              </div>
              <InfoRow label="Дата народження" value={formatDob(profile.dateOfBirth)} />
              <InfoRow label="Стать" value={profile.gender ? GENDER_LABELS[profile.gender] : undefined} />
              <InfoRow label="Клуб / секція" value={profile.club} />
              <InfoRow label="Email" value={profile.email} />
            </div>

            {/* Sport details */}
            <div
              className="rounded-2xl px-6 py-2"
              style={{
                background: "linear-gradient(170deg, #1c1c20 0%, #111113 100%)",
                border: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-widest py-3"
                style={{ color: "var(--accent)" }}
              >
                Спортивні дані
              </div>
              <InfoRow
                label="Вагова категорія"
                value={profile.weightCategory ? WEIGHT_CATEGORY_LABELS[profile.weightCategory] : undefined}
              />
              <InfoRow
                label="Провідна рука"
                value={profile.preferredHand ? HAND_LABELS[profile.preferredHand] : undefined}
              />
              <InfoRow
                label="Стиль боротьби"
                value={profile.preferredStyle ? STYLE_LABELS[profile.preferredStyle] : undefined}
              />
            </div>
          </div>
        )}
      </main>

      {profile && (
        <EditModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          profile={profile}
          onSave={setProfile}
        />
      )}
    </div>
  );
}
