import QwixxScorecard from "@/components/QwixxScorecard";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

export default function Home() {
  return (
    <div className="min-h-screen p-4 sm:p-8 flex flex-col items-center">
      <header className="mb-6">
        <h1 className="text-4xl font-bold text-center">
          <span className="text-red-600">Q</span>
          <span className="text-yellow-500">W</span>
          <span className="text-green-600">I</span>
          <span className="text-blue-600">X</span>
          <span className="text-purple-600">X</span>
          <span> Scorecard</span>
        </h1>
      </header>

      <main className="w-full max-w-3xl mx-auto sm:p-8 rounded-lg shadow-md">
        <QwixxScorecard />
      </main>

      <footer className="mt-8 text-center text-sm text-muted-foreground flex flex-row items-center justify-between w-full max-w-3xl mx-auto px-2">
        <p>© {new Date().getFullYear()} - Digital Qwixx Scorecard</p>
        <ThemeSwitcher />
      </footer>
    </div>
  );
}
