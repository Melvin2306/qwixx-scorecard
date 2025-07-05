import QwixxScorecard from "@/components/QwixxScorecard";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

export default function Home() {
  return (
    <div className="min-h-screen p-2 sm:p-4 lg:p-8 flex flex-col items-center">
      <header className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-4xl font-bold text-center">
          <span className="text-red-600">Q</span>
          <span className="text-yellow-500">W</span>
          <span className="text-green-600">I</span>
          <span className="text-blue-600">X</span>
          <span className="text-purple-600">X</span>
          <span> Scorecard</span>
        </h1>
      </header>

      <main className="w-full max-w-3xl mx-auto p-1 sm:p-2 rounded-lg shadow-md">
        <QwixxScorecard />
      </main>

      <footer className="mt-4 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground flex flex-row items-center justify-between w-full max-w-3xl mx-auto px-1 sm:px-2">
        <p>© {new Date().getFullYear()} - Digital Qwixx Scorecard</p>
        <ThemeSwitcher />
      </footer>
    </div>
  );
}
