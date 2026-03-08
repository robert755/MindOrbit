import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function RegisterPage() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {

      setLoading(true);

      await axios.post("http://localhost:8081/users", formData);

      navigate("/");

    } catch (err) {

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Registration failed.");
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#f7f3ee] flex items-center justify-center px-6">

      <div className="w-full max-w-md rounded-[20px] border border-white/40 bg-white/70 shadow-[0_25px_70px_rgba(70,70,70,0.15)] backdrop-blur-md">

        <div className="px-12 py-10">

          <div className="text-center mb-8">
            <h2 className="text-3xl font-semibold text-[#2f3b33]">
              Create account
            </h2>

            <p className="mt-2 text-sm text-[#7d867f]">
              Start tracking your mental wellbeing.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="text-sm text-[#556157]">
                First name
              </label>

              <input
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full mt-1 rounded-xl border border-[#dde4dc] bg-[#fcfbf8] px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm text-[#556157]">
                Last name
              </label>

              <input
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full mt-1 rounded-xl border border-[#dde4dc] bg-[#fcfbf8] px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm text-[#556157]">
                Username
              </label>

              <input
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full mt-1 rounded-xl border border-[#dde4dc] bg-[#fcfbf8] px-4 py-3"
              />

              <p className="text-xs text-[#7d867f] mt-1">
                Must contain between 3 and 20 characters.
              </p>
            </div>

            <div>
              <label className="text-sm text-[#556157]">
                Email
              </label>

              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full mt-1 rounded-xl border border-[#dde4dc] bg-[#fcfbf8] px-4 py-3"
              />

              <p className="text-xs text-[#7d867f] mt-1">
                Must be a valid email address.
              </p>
            </div>

            <div>
              <label className="text-sm text-[#556157]">
                Password
              </label>

              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full mt-1 rounded-xl border border-[#dde4dc] bg-[#fcfbf8] px-4 py-3"
              />

              <p className="text-xs text-[#7d867f] mt-1">
                Password must contain at least 6 characters.
              </p>
            </div>

            {error && (
              <p className="text-red-500 text-sm">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#2f3b33] py-3 text-white font-semibold"
            >
              {loading ? "Creating..." : "Create account"}
            </button>

          </form>

          <p className="mt-6 text-center text-sm text-[#7d867f]">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/")}
              className="underline text-[#2f3b33]"
            >
              Login
            </button>
          </p>

        </div>

      </div>

    </div>
  );
}