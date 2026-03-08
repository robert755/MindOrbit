import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import background from "../assets/background.jpg";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  // Funcția de Logout
  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    navigate("/", { replace: true });
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col relative"
      style={{ backgroundImage: `url(${background})` }}
    >
      {/* Container principal centrat */}
      <div className="min-h-screen flex flex-col justify-center px-8 md:px-14 lg:px-20 py-10 gap-16 md:gap-24">
        
        {/* TEXT */}
        <div
          className={`max-w-4xl mx-auto transition-all duration-1000 ease-out ${
            showContent
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-semibold tracking-[0.2em] text-[#2f3b33] mb-8 text-center md:text-left">
            MindOrbit
          </h1>

          <p className="text-xl md:text-2xl leading-relaxed text-[#4f5d54] mb-6 max-w-3xl text-center md:text-left">
            MindOrbit is a quiet space designed to help you reflect on your
            emotions, understand your inner patterns and build healthier mental
            habits through daily reflection.
          </p>

          <p className="italic text-[#2f3b33] text-lg md:text-xl leading-relaxed max-w-3xl text-center md:text-left">
            "Taking care of your mental health is not a luxury — it is a
            necessity for a balanced life."
          </p>
        </div>

        {/* CARDURI */}
        <div
          className={`transition-all duration-1000 ease-out delay-200 ${
            showContent
              ? "translate-y-0 opacity-100"
              : "translate-y-8 opacity-0"
          }`}
        >
          <div className="flex flex-col md:flex-row justify-center gap-8 max-w-6xl mx-auto">
            {/* Card 1 */}
            <div className="rounded-[28px] border border-white/30 bg-white/35 backdrop-blur-md p-10 md:p-12 shadow-[0_20px_50px_rgba(70,70,70,0.08)] text-center min-h-[300px] flex flex-col justify-between w-full md:w-80 lg:w-96">
              <div>
                <h2 className="text-3xl font-semibold text-[#2f3b33] mb-5">
                  Daily Check-In
                </h2>
                <p className="text-lg leading-8 text-[#5e6961]">
                  Record how you feel today and track your emotional state.
                </p>
              </div>
              <button
                onClick={() => navigate("/daily-check-in")}
                className="mt-8 rounded-2xl bg-[#2f3b33] px-8 py-4 text-base font-semibold text-white transition hover:scale-[1.05] hover:opacity-95 shadow-md"
              >
                Start
              </button>
            </div>

            {/* Card 2 */}
            <div className="rounded-[28px] border border-white/30 bg-white/35 backdrop-blur-md p-10 md:p-12 shadow-[0_20px_50px_rgba(70,70,70,0.08)] text-center min-h-[300px] flex flex-col justify-between w-full md:w-80 lg:w-96">
              <div>
                <h2 className="text-3xl font-semibold text-[#2f3b33] mb-5">
                  Reflection Journal
                </h2>
                <p className="text-lg leading-8 text-[#5e6961]">
                  Explore your past entries and emotional patterns.
                </p>
              </div>
              <button
                onClick={() => navigate("/reflection-journal")}
                className="mt-8 rounded-2xl bg-[#2f3b33] px-8 py-4 text-base font-semibold text-white transition hover:scale-[1.05] hover:opacity-95 shadow-md"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BUTON LOGOUT - Dreapta Jos */}
      <button
        onClick={handleLogout}
        className="fixed bottom-8 right-8 px-6 py-3 rounded-2xl border border-white/20 bg-white/20 backdrop-blur-lg text-[#2f3b33] font-medium shadow-lg transition-all hover:bg-red-500 hover:text-white hover:border-red-500 active:scale-95"
      >
        Logout
      </button>
    </div>
  );
}