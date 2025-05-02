import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const RegisterForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    congregation: "",
    referralSource: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    e.preventDefault();
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("https://geocode-na1k.onrender.com/api/employees/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setMessage(data.message);
      setFormData({
        name: "",
        email: "",
        password: "",
        congregation: "",
        referralSource: "",
      });

      navigate("/auth/login");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] max-w-[390px] w-full rounded-[20px] border-[1px] border-gray-300 min-h-[60vh]">
      <form className="card-body flex flex-col gap-5 p-10" onSubmit={handleSubmit} noValidate>
        <div className="text-center mb-2.5">
          <h3 className="text-lg font-semibold text-gray-900 mb-2.5">Sign up</h3>
          <div className="flex items-center justify-center font-medium">
            <span className="text-sm text-gray-600 me-1.5">Already have an account?</span>
            <Link to="/auth/login" className="text-sm link text-[#4e70e9]">Sign in</Link>
          </div>
        </div>

        {error && (
          <div className="text-sm bg-red-100 border border-red-400 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        {message && (
          <div className="text-sm bg-green-100 border border-green-400 text-green-700 p-3 rounded">
            {message}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900">Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter name"
            autoComplete="off"
            value={formData.name}
            onChange={handleChange}
            required
            className="form-control bg-[#ebebeb] rounded-lg p-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900">Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter email"
            autoComplete="off"
            value={formData.email}
            onChange={handleChange}
            required
            className="form-control bg-[#ebebeb] rounded-lg p-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900">Password</label>
          <input
            type="password"
            name="password"
            placeholder="Enter password"
            autoComplete="off"
            value={formData.password}
            onChange={handleChange}
            required
            className="form-control bg-[#ebebeb] rounded-lg p-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900">Congregation Name</label>
          <input
            type="text"
            name="congregation"
            placeholder="Enter congregation name"
            value={formData.congregation}
            onChange={handleChange}
            className="form-control bg-[#ebebeb] rounded-lg p-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900">Where did you hear about this site?</label>
          <select
            name="referralSource"
            value={formData.referralSource}
            onChange={handleChange}
            className="form-control bg-[#ebebeb] rounded-lg p-2"
          >
            <option value="">Select an option</option>
            <option value="friend">Friend</option>
            <option value="socialMedia">Social Media</option>
            <option value="email">Email</option>
            <option value="event">Event</option>
            <option value="other">Other</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Please wait...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
