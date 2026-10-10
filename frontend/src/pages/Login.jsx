import { useState } from 'react';
import { api } from '../api.js';

export default function Login({ onLogin }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendOtp(e) {
    e.preventDefault();
    setError('');
    if (!/^\+[1-9]\d{7,14}$/.test(phone.trim())) {
      return setError('Use country code format, e.g. +919876543210');
    }
    setLoading(true);
    try {
      const data = await api('/auth/send-otp', { method: 'POST', body: { phone: phone.trim() } });
      setIsNewUser(data.isNewUser);
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{4,8}$/.test(code.trim())) return setError('Enter the numeric code you received');
    if (isNewUser && name.trim().length < 2) return setError('Please enter your name');
    setLoading(true);
    try {
      const data = await api('/auth/verify-otp', {
        method: 'POST',
        body: { phone: phone.trim(), code: code.trim(), name: name.trim() },
      });
      onLogin(data);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <section className="card narrow">
      <p className="tag">{step === 'phone' ? 'Step 1 / 2' : 'Step 2 / 2'}</p>
      <h2>{step === 'phone' ? 'Log in or sign up' : isNewUser ? 'Welcome! Create your account' : 'Welcome back'}</h2>

      {step === 'phone' ? (
        <form onSubmit={sendOtp}>
          <label>
            Phone number
            <input
              type="tel"
              placeholder="+919876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={loading}>{loading ? 'Sending…' : 'Send OTP'}</button>
        </form>
      ) : (
        <form onSubmit={verifyOtp}>
          <p className="muted">We sent a code to <b>{phone}</b> via WhatsApp or SMS.</p>
          {isNewUser && (
            <label>
              Your name
              <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} autoFocus />
            </label>
          )}
          <label>
            OTP code
            <input
              inputMode="numeric"
              placeholder="123456"
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus={!isNewUser}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={loading}>{loading ? 'Verifying…' : 'Verify & continue'}</button>
          <button type="button" className="link" onClick={() => { setStep('phone'); setCode(''); setError(''); }}>
            Change number
          </button>
        </form>
      )}
    </section>
  );
}
