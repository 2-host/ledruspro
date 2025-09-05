// src/components/LoginModal.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

export default function LoginModal() {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  function onEmailChange(v: string) {
    setEmail(v);
    setOtpSent(false);
    setCode('');
    setSecondsLeft(0);
    setInfo(null);
    setError(null);
  }

  async function requestOtp() {
    const normEmail = email.trim().toLowerCase();
    if (!normEmail || secondsLeft > 0 || sending) return;
    try {
      setSending(true);
      setError(null);
      const res = await fetch('/api/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normEmail }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error || 'Не удалось отправить код');
      }
      setOtpSent(true);
      setSecondsLeft(60);
      setInfo(`Ключ отправлен на ${normEmail}. Проверьте входящие и «Спам».`);
      setTimeout(() => codeInputRef.current?.focus(), 50);
    } catch (e: any) {
      setError(e?.message || 'Ошибка отправки');
    } finally {
      setSending(false);
    }
  }

  async function verifyAndLogin() {
    if (!otpSent || !code || verifying) return;
    try {
      setVerifying(true);
      setError(null);
      const normEmail = email.trim().toLowerCase();

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // важно, чтобы Set-Cookie применился
        body: JSON.stringify({ email: normEmail, code: code.trim() }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Ошибка входа');

      // Бэкенд отдаёт redirect: '/provider/select'
      const redirect = payload?.redirect || '/provider/select';
      window.location.href = redirect;
    } catch (e: any) {
      setError(e?.message || 'Ошибка входа');
    } finally {
      setVerifying(false);
    }
  }

  const resendLabel =
    secondsLeft > 0 ? `Отправить снова (${secondsLeft})` : otpSent ? 'Отправить снова' : 'Получить код';

  return (
    <div className="modal fade" id="loginModal" tabIndex={-1} aria-labelledby="loginModalLabel" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h1 className="modal-title fs-5" id="loginModalLabel">Вход для исполнителей</h1>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Закрыть"></button>
          </div>

          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">Email</label>
              <div className="input-group">
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={otpSent && secondsLeft > 0}
                />
                <button
                  className="btn btn-outline-primary"
                  type="button"
                  disabled={!email || secondsLeft > 0 || sending}
                  onClick={requestOtp}
                >
                  {sending ? 'Отправляем...' : resendLabel}
                </button>
              </div>
              <div className="form-text">Пришлём 6-значный код.</div>
            </div>

            {info && <div className="alert alert-info py-2">{info}</div>}
            {error && <div className="alert alert-danger py-2">{error}</div>}

            {otpSent && (
              <div className="mb-2">
                <label className="form-label">Код из письма</label>
                <div className="input-group">
                  <input
                    ref={codeInputRef}
                    className="form-control"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    inputMode="numeric"
                    maxLength={6}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') verifyAndLogin();
                    }}
                    autoComplete="one-time-code"
                  />
                  <button
                    className="btn btn-success"
                    type="button"
                    disabled={!code || verifying}
                    onClick={verifyAndLogin}
                  >
                    {verifying ? 'Проверяем...' : 'Войти'}
                  </button>
                </div>
                <div className="form-text">Код действителен 10 минут.</div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
