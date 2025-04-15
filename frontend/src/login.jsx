import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://map-1-n35u.onrender.com/api/employees/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid credentials');
      }

      const { token, user } = data;

      // Save token and role
      if (form.remember) {
        localStorage.setItem('email', user.email);
        localStorage.setItem('token', token);
        localStorage.setItem('role', user.role);
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('role', user.role);
      }

      // 🔄 Role-based redirection
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFFFF] max-w-[390px] w-full rounded-[20px] border-[1px] border-gray-300 min-h-[60vh]">
      <form className="card-body flex flex-col gap-5 p-10" onSubmit={handleSubmit} noValidate>
        <div className="text-center mb-2.5">
          <h3 className="text-lg font-semibold text-gray-900 mb-2.5 ">Sign in</h3>
          <div className="flex items-center justify-center font-medium">
            <span className="text-sm text-gray-600 me-1.5">Need an account?</span>
            <Link to="/register" className="text-sm link text-[#4e70e9]">Sign up</Link>
          </div>
        </div>

        {error && (
          <div className="text-sm bg-red-100 border border-red-400 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="form-label text-gray-900 ">Email</label>
          <input
            type="email"
            name="email"
            placeholder="Enter email"
            autoComplete="off"
            value={form.email}
            onChange={handleChange}
            required
            className="form-control  bg-[#ebebeb] rounded-lg p-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-1">
            <label className="form-label text-gray-900 ">Password</label>
            <Link to="/auth/reset-password" className="text-sm link text-[#4e70e9]">Forgot Password?</Link>
          </div>
          <div className="relative">
            <div className="relative w-full">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter password"
                autoComplete="off"
                value={form.password}
                onChange={handleChange}
                required
                className="bg-[#ebebeb] rounded-lg p-2 w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-2.5 text-gray-500 text-sm"
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
        </div>

        <label className="checkbox-group">
          <input
            type="checkbox"
            name="remember"
            checked={form.remember}
            onChange={handleChange}
            className="checkbox checkbox-sm"
          />
          <span className="m-2">Remember me</span>
        </label>

        <button type="submit" className="bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600" disabled={loading}>
          {loading ? 'Please wait...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
