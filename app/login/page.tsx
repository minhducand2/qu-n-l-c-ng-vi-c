'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './login.module.css';

type CurrentUser = { userId: string; email: string; displayName: string };

function Icon({ name, size = 20 }: { name: 'layers'|'shield'|'eye'|'eyeOff'|'arrow'|'check'|'logout'|'lock'|'spark'|'spinner'; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  const paths = {
    layers: <><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
    eye: <><path d="M2 12s3.7-7 10-7 10 7 10 7-3.7 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></>,
    eyeOff: <><path d="m3 3 18 18"/><path d="M10.6 5.1A10 10 0 0 1 12 5c6.3 0 10 7 10 7a14 14 0 0 1-3.1 3.9M6.2 6.3C3.4 8.1 2 12 2 12s3.7 7 10 7a10.6 10.6 0 0 0 4.1-.8"/><path d="M10 10a3 3 0 0 0 4 4"/></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5m5 5H9"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    spark: <><path d="m12 2 1.9 7.1L21 11l-7.1 1.9L12 20l-1.9-7.1L3 11l7.1-1.9L12 2Z"/></>,
    spinner: <><path d="M12 2a10 10 0 0 1 10 10"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) return null;
        const data = await res.json() as { user?: CurrentUser };
        return data.user ?? null;
      })
      .then((value) => { if (active) setUser(value); })
      .catch(() => { if (active) setError('Không thể kiểm tra phiên đăng nhập.'); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError(''); setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string; user?: CurrentUser };
      if (!response.ok) {
        setError(response.status === 429 ? 'Đã thử đăng nhập quá nhiều lần. Vui lòng đợi 15 phút.' : result.error || 'Đăng nhập không thành công.');
        return;
      }
      // Require session roundtrip, not just a successful login payload.
      const verify = await fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' });
      if (!verify.ok) { setError('Đăng nhập thành công nhưng không xác minh được phiên.'); return; }
      const data = await verify.json() as { user?: CurrentUser };
      if (!data.user) { setError('Không xác minh được tài khoản.'); return; }
      setUser(data.user);
      setPassword('');
    } catch { setError('Không kết nối được máy chủ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  }

  async function logout() {
    if (loading) return;
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      if (!response.ok) { setError('Đăng xuất chưa thành công. Vui lòng thử lại.'); return; }
      setUser(null); setPassword('');
    } catch { setError('Không kết nối được máy chủ. Vui lòng thử lại.'); }
    finally { setLoading(false); }
  }

  return <main className={styles.page}>
    <div className={styles.shell}>
      <section className={styles.story} aria-label="Giới thiệu TEAM360">
        <div className={styles.brand}><span className={styles.brandIcon}><Icon name="layers" size={22}/></span><span>TEAM<span className={styles.brandAccent}>360</span></span></div>
        <div className={styles.storyBody}>
          <div className={styles.eyebrow}><span className={styles.pulse}/> NỀN TẢNG QUẢN LÝ CÔNG VIỆC</div>
          <h1>Tập trung công việc.<br/><span>Đồng bộ đội ngũ.</span><br/>Bứt phá hiệu suất.</h1>
          <p>Một không gian làm việc rõ ràng, liền mạch cho đội ngũ và nhà quản lý.</p>
          <div className={styles.visual} aria-hidden="true">
            <div className={styles.visualTop}><span className={styles.dotGroup}>● ● ●</span><span>Tổng quan công việc</span><span>•••</span></div>
            <div className={styles.visualBody}>
              <div className={styles.visualSummary}><div><span className={styles.visualLabel}>Tiến độ công việc</span><strong>76%</strong></div><div className={styles.bar}><span/></div></div>
              <div className={styles.visualRows}><span><i className={styles.circleBlue}/><b/></span><span><i className={styles.circleGreen}/><b/></span><span><i className={styles.circlePurple}/><b/></span></div>
            </div>
          </div>
        </div>
        <div className={styles.storyFooter}><Icon name="shield" size={17}/> Không gian làm việc riêng tư, bảo vệ bằng phiên đăng nhập</div>
      </section>
      <section className={styles.formSide}>
        <div className={styles.formTop}><span className={styles.mobileBrand}>TEAM<span>360</span></span><span className={styles.internalTag}><Icon name="lock" size={13}/> Hệ thống nội bộ</span></div>
        <div className={styles.formContainer}>
          {checking ? <div className={styles.checking} role="status"><span className={styles.spinner}><Icon name="spinner"/></span> Đang kiểm tra phiên đăng nhập...</div> : user ? <>
            <div className={styles.successIcon}><Icon name="check" size={28}/></div>
            <div className={styles.sectionLabel}>ĐĂNG NHẬP THÀNH CÔNG</div>
            <h2>Chào mừng trở lại!</h2>
            <p className={styles.subtext}>Phiên đăng nhập độc lập của bạn đang hoạt động.</p>
            <div className={styles.profile}><div className={styles.avatar}>{(user.displayName || user.email).slice(0, 1).toUpperCase()}</div><div className={styles.profileText}><strong>{user.displayName}</strong><span>{user.email}</span></div><span className={styles.online} title="Phiên hợp lệ"/></div>
            <div className={styles.notice}><Icon name="shield" size={19}/><span>Đăng nhập đã được xác minh. Khu vực quản lý công việc đang chờ chuyển đổi sang xác thực phiên mới; chưa sử dụng trang cũ để kiểm thử quyền tài khoản này.</span></div>
            {error && <p className={styles.error} role="alert">{error}</p>}
            <button className={styles.secondaryButton} type="button" onClick={logout} disabled={loading}><Icon name="logout" size={18}/>{loading ? 'Đang đăng xuất...' : 'Đăng xuất'}</button>
          </> : <>
            <div className={styles.welcomeIcon}><Icon name="spark" size={23}/></div>
            <div className={styles.sectionLabel}>CHÀO MỪNG TRỞ LẠI</div>
            <h2>Đăng nhập tài khoản</h2>
            <p className={styles.subtext}>Nhập thông tin để tiếp tục vào không gian làm việc của bạn.</p>
            <form onSubmit={login} className={styles.form}>
              <label htmlFor="auth-email">Địa chỉ email</label>
              <input id="auth-email" className={styles.input} type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="tenban@congty.com" maxLength={254} required disabled={loading}/>
              <div className={styles.passwordHeader}><label htmlFor="auth-password">Mật khẩu</label></div>
              <div className={styles.passwordWrap}><input id="auth-password" className={styles.passwordInput} type={visible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nhập mật khẩu của bạn" required disabled={loading} maxLength={256}/><button type="button" aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setVisible(!visible)} className={styles.eyeButton}><Icon name={visible ? 'eyeOff' : 'eye'} size={19}/></button></div>
              {error && <p className={styles.error} role="alert">{error}</p>}
              <button type="submit" className={styles.submit} disabled={loading}>{loading ? <><span className={styles.spinner}><Icon name="spinner" size={18}/></span> Đang xác thực...</> : <>Đăng nhập <Icon name="arrow" size={19}/></>}</button>
            </form>
            <div className={styles.help}><Icon name="shield" size={17}/> Tài khoản được quản trị viên cấp và quản lý.</div>
          </>}
        </div>
        <div className={styles.bottom}>© {new Date().getFullYear()} TEAM360 <span>•</span> Phiên bản thử nghiệm nội bộ</div>
      </section>
    </div>
  </main>;
}
