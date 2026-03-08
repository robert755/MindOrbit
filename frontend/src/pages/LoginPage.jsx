import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function LoginPage() {
  const [animate, setAnimate] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 1400); // Restaurat la 1.4 secunde pentru efectul de intro

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password.trim()) {
      setErrorMessage("Please enter both username and password.");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post("http://localhost:8081/users/login", {
        username,
        password,
      });

      localStorage.setItem("userId", response.data.id);
      localStorage.setItem("username", response.data.username);
      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f3ee]">
      {/* Background decorativ */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(214,225,214,0.55),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(234,220,204,0.6),_transparent_30%)]" />

      <div className="relative flex min-h-screen items-center justify-center px-6">
        
        {/* TITLU - Restaurat la poziționare absolută pentru mișcarea originală */}
        <div
          className={`absolute left-1/2 z-20 flex -translate-x-1/2 flex-col items-center text-center transition-all duration-1000 ease-in-out ${
            animate 
              ? "top-10 scale-75 opacity-95" 
              : "top-1/2 -translate-y-1/2 scale-100 opacity-100"
          }`}
        >
          <h1 className="text-6xl font-semibold tracking-[0.25em] text-[#2f3b33] md:text-7xl">
            MindOrbit
          </h1>
          <p className="mt-4 max-w-xl text-sm tracking-[0.15em] text-[#6e786f] uppercase">
            your daily ritual for clarity, balance and self-reflection
          </p>
        </div>

        {/* CARD - Apare după ce titlul urcă */}
        <div
          className={`w-full max-w-md rounded-[32px] border border-white/50 bg-white/70 shadow-[0_25px_70px_rgba(70,70,70,0.12)] backdrop-blur-xl transition-all duration-1000 ease-out ${
            animate
              ? "translate-y-20 opacity-100"
              : "pointer-events-none translate-y-32 opacity-0"
          }`}
        >
          <div className="px-10 py-12">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-semibold text-[#2f3b33]">Welcome back</h2>
              <p className="mt-3 text-base text-[#7d867f]">
                Enter your account and continue your journey.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm text-[#556157]">Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-[#dde4dc] bg-[#fcfbf8]/50 px-5 py-4 text-base text-[#2f3b33] outline-none transition-all focus:border-[#aab8ab] focus:ring-2 focus:ring-[#dbe5db]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-[#556157]">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#dde4dc] bg-[#fcfbf8]/50 px-5 py-4 text-base text-[#2f3b33] outline-none transition-all focus:border-[#aab8ab] focus:ring-2 focus:ring-[#dbe5db]"
                />
              </div>

              {errorMessage && (
                <p className="text-sm font-medium text-red-500">{errorMessage}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-[#2f3b33] py-4 text-sm font-bold tracking-[0.15em] text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? "SIGNING IN..." : "SIGN IN"}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-[#7d867f]">
                Hey, create an account{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="font-semibold text-[#2f3b33] underline underline-offset-4"
                >
                  here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}