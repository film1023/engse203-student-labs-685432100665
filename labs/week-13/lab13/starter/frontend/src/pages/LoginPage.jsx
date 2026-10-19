import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, login, logout } from '../services/authService.js';

function LoginPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => getCurrentUser());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      setUser(await login(email.trim(), password));
      setPassword('');
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    logout();
    setUser(null);
  }

  return (
    <section data-testid="page-login">
      <div className="page-heading">
        <div>
          <p className="eyebrow dark">STAFF ONLY</p>
          <h1>เข้าสู่ระบบเจ้าหน้าที่</h1>
          <p>เปลี่ยนสถานะและลบคำร้องได้หลังเข้าสู่ระบบ</p>
        </div>
      </div>

      {user ? (
        <div className="panel login-panel">
          <p>เข้าสู่ระบบแล้วในชื่อ <strong>{user.name}</strong> ({user.role})</p>
          <button className="button secondary" type="button" onClick={handleLogout}>ออกจากระบบ</button>
        </div>
      ) : (
        <form className="panel login-panel" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="email">อีเมล</label>
            <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">รหัสผ่าน</label>
            <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="button primary login-submit" type="submit" disabled={submitting}>
            {submitting ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
          </button>
          {error && <p className="error" role="alert">{error}</p>}
          {import.meta.env.VITE_DEMO_LOGIN_HINT && (
            <p className="login-hint">บัญชีทดสอบ: {import.meta.env.VITE_DEMO_LOGIN_HINT}</p>
          )}
        </form>
      )}
    </section>
  );
}

export default LoginPage;
