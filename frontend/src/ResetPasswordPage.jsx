import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';



const ResetPasswordPage = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate(); 

  const handleSendOtp = async () => {
    setError('');
    setMessage('');
    try {
      const res = await fetch('https://map-5.onrender.com/api/employees/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessage(data.message);
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    setMessage('');
    try {
      const res = await fetch('https://map-5.onrender.com/api/employees/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
  
      setMessage(data.message);
  
      // ✅ Redirect after showing success message
      setTimeout(() => navigate('/auth/login'), 1500);
  
    } catch (err) {
      setError(err.message);
    }
  };
  

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">Reset Password</h2>

      {error && <div className="text-red-600 mb-3">{error}</div>}
      {message && <div className="text-green-600 mb-3">{message}</div>}

      {step === 1 ? (
        <>
          <label>Email:</label>
          <input
            type="email"
            className="w-full p-2 border rounded mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            onClick={handleSendOtp}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Send OTP
          </button>
        </>
      ) : (
        <>
          <label>Enter OTP:</label>
          <input
            type="text"
            className="w-full p-2 border rounded mb-3"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          <label>New Password:</label>
          <input
            type="password"
            className="w-full p-2 border rounded mb-3"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <button
            onClick={handleResetPassword}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Reset Password
          </button>
        </>
      )}
    </div>
  );
};

export default ResetPasswordPage;
