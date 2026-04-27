export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Over The Top
        </h1>
        <p className="text-gray-400 text-lg">
          Платформа для армрестлерів — тренування, турніри, аналітика
        </p>

        <div className="grid grid-cols-3 gap-4 mt-10">
          <Card title="Тренування" description="Журнал тренувань і прогрес" href="/training" />
          <Card title="Турніри" description="Результати та сітки" href="/tournaments" />
          <Card title="Аналітика" description="Статистика і графіки" href="/analytics" />
        </div>

        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/login"
            className="px-6 py-2 bg-white text-gray-950 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Увійти
          </a>
          <a
            href="/register"
            className="px-6 py-2 border border-gray-600 rounded-lg font-semibold hover:border-gray-400 transition"
          >
            Реєстрація
          </a>
        </div>
      </div>
    </main>
  );
}

function Card({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a
      href={href}
      className="block p-5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition"
    >
      <h2 className="font-semibold text-lg mb-1">{title}</h2>
      <p className="text-gray-400 text-sm">{description}</p>
    </a>
  );
}
