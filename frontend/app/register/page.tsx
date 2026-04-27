"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { register, saveToken } from "@/lib/auth";
import { Gender, WeightCategory, PreferredHand, ArmStyle } from "@/lib/types";

const STEPS = ["Основне", "Профіль", "Стиль"] as const;

const WEIGHT_LABELS: Record<WeightCategory, string> = {
  [WeightCategory.Under60kg]: "до 60 кг",
  [WeightCategory.Under65kg]: "до 65 кг",
  [WeightCategory.Under70kg]: "до 70 кг",
  [WeightCategory.Under75kg]: "до 75 кг",
  [WeightCategory.Under80kg]: "до 80 кг",
  [WeightCategory.Under85kg]: "до 85 кг",
  [WeightCategory.Under90kg]: "до 90 кг",
  [WeightCategory.Under100kg]: "до 100 кг",
  [WeightCategory.Over100kg]: "понад 100 кг",
};

const STYLE_INFO: Record<ArmStyle, { label: string; desc: string }> = {
  [ArmStyle.TopRoll]: { label: "Top Roll", desc: "Пронація зап'ястка, відкат пальців суперника" },
  [ArmStyle.Hook]:    { label: "Hook",     desc: "Супінація зап'ястка, тяга до себе" },
  [ArmStyle.Press]:   { label: "Press",    desc: "Натиск плечем, King's Move" },
  [ArmStyle.Tricep]:  { label: "Tricep",   desc: "Тиск трицепсом зверху вниз" },
  [ArmStyle.Universal]: { label: "Universal", desc: "Комбінований стиль" },
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  gender: Gender | "";
  weight: string;
  weightCategory: WeightCategory | "";
  preferredHand: PreferredHand | "";
  preferredStyle: ArmStyle | "";
  country: string;
  club: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", email: "", password: "",
    dateOfBirth: "", gender: "", weight: "", weightCategory: "",
    preferredHand: "", preferredStyle: "", country: "", club: "",
  });

  const set = (field: keyof FormData, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const next = () => { setError(""); setStep(s => s + 1); };
  const back = () => { setError(""); setStep(s => s - 1); };

  const validateStep = () => {
    if (step === 0) {
      if (!form.firstName.trim()) return "Введіть ім'я";
      if (!form.lastName.trim()) return "Введіть прізвище";
      if (!form.email.trim()) return "Введіть email";
      if (form.password.length < 6) return "Пароль мінімум 6 символів";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    next();
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender === "" ? null : form.gender,
        weight: form.weight ? parseFloat(form.weight) : null,
        weightCategory: form.weightCategory === "" ? null : form.weightCategory,
        preferredHand: form.preferredHand === "" ? null : form.preferredHand,
        preferredStyle: form.preferredStyle === "" ? null : form.preferredStyle,
        country: form.country || null,
        club: form.club || null,
      };
      const res = await register(payload);
      saveToken(res.token);
      router.push("/dashboard");
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? "Помилка реєстрації. Спробуй ще.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Over The Top</h1>
          <p className="text-gray-400 mt-1">Реєстрація спортсмена</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold
                ${i < step ? "bg-green-500 text-white" : i === step ? "bg-white text-gray-950" : "bg-gray-800 text-gray-500"}`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${i === step ? "text-white" : "text-gray-500"}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="w-8 h-px bg-gray-700 mx-1" />}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Step 0 — Основне */}
          {step === 0 && (
            <>
              <h2 className="text-white font-semibold text-lg">Основна інформація</h2>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ім'я" value={form.firstName} onChange={v => set("firstName", v)} placeholder="Олексій" />
                <Field label="Прізвище" value={form.lastName} onChange={v => set("lastName", v)} placeholder="Шевченко" />
              </div>
              <Field label="Email" type="email" value={form.email} onChange={v => set("email", v)} placeholder="you@example.com" />
              <Field label="Пароль" type="password" value={form.password} onChange={v => set("password", v)} placeholder="Мінімум 6 символів" />
            </>
          )}

          {/* Step 1 — Профіль */}
          {step === 1 && (
            <>
              <h2 className="text-white font-semibold text-lg">Профіль</h2>

              <div>
                <label className="text-gray-400 text-sm block mb-1">Стать</label>
                <div className="grid grid-cols-2 gap-2">
                  {([Gender.Male, Gender.Female] as const).map(g => (
                    <button key={g} type="button"
                      onClick={() => set("gender", form.gender === g ? "" : g)}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition
                        ${form.gender === g ? "bg-white text-gray-950 border-white" : "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500"}`}>
                      {g === Gender.Male ? "Чоловік" : "Жінка"}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Дата народження" type="date" value={form.dateOfBirth} onChange={v => set("dateOfBirth", v)} />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Вага (кг)" type="number" value={form.weight} onChange={v => set("weight", v)} placeholder="80" />
                <div>
                  <label className="text-gray-400 text-sm block mb-1">Категорія</label>
                  <select
                    value={form.weightCategory}
                    onChange={e => set("weightCategory", e.target.value === "" ? "" : parseInt(e.target.value))}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500">
                    <option value="">— вибрати</option>
                    {Object.entries(WEIGHT_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Field label="Країна" value={form.country} onChange={v => set("country", v)} placeholder="Україна" />
              <Field label="Клуб (необов'язково)" value={form.club} onChange={v => set("club", v)} placeholder="Назва клубу" />
            </>
          )}

          {/* Step 2 — Стиль */}
          {step === 2 && (
            <>
              <h2 className="text-white font-semibold text-lg">Стиль боротьби</h2>

              <div>
                <label className="text-gray-400 text-sm block mb-2">Робоча рука</label>
                <div className="grid grid-cols-3 gap-2">
                  {([PreferredHand.Right, PreferredHand.Left, PreferredHand.Both] as const).map(h => (
                    <button key={h} type="button"
                      onClick={() => set("preferredHand", form.preferredHand === h ? "" : h)}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition
                        ${form.preferredHand === h ? "bg-white text-gray-950 border-white" : "bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-500"}`}>
                      {h === PreferredHand.Right ? "Права" : h === PreferredHand.Left ? "Ліва" : "Обидві"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-400 text-sm block mb-2">Улюблений стиль</label>
                <div className="space-y-2">
                  {([ArmStyle.TopRoll, ArmStyle.Hook, ArmStyle.Press, ArmStyle.Tricep, ArmStyle.Universal] as const).map(s => (
                    <button key={s} type="button"
                      onClick={() => set("preferredStyle", form.preferredStyle === s ? "" : s)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition
                        ${form.preferredStyle === s ? "bg-white/10 border-white text-white" : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"}`}>
                      <span className="font-medium">{STYLE_INFO[s].label}</span>
                      <span className="text-xs text-gray-400 block mt-0.5">{STYLE_INFO[s].desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <button onClick={back} className="flex-1 py-2.5 rounded-lg border border-gray-700 text-gray-300 text-sm hover:border-gray-500 transition">
                Назад
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={handleNext} className="flex-1 py-2.5 rounded-lg bg-white text-gray-950 font-semibold text-sm hover:bg-gray-200 transition">
                Далі
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-white text-gray-950 font-semibold text-sm hover:bg-gray-200 transition disabled:opacity-50">
                {loading ? "Реєструємо..." : "Зареєструватись"}
              </button>
            )}
          </div>

          <p className="text-center text-gray-500 text-sm pt-1">
            Вже є акаунт?{" "}
            <a href="/login" className="text-white hover:underline">Увійти</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-gray-400 text-sm block mb-1">{label}</label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm
          placeholder:text-gray-600 focus:outline-none focus:border-gray-500 transition"
      />
    </div>
  );
}
