import React, { useState } from 'react';
import { LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';

// 한글 이름(아이디)을 Supabase Auth용 고유 이메일 형식으로 안전하게 변환
export const nameToAuthEmail = (rawName) => {
  const clean = String(rawName || '').trim().replace(/\s+/g, '');
  const encoded = Array.from(clean)
    .map((ch) => ch.codePointAt(0).toString(16))
    .join('_');
  return `u_${encoded}@cheongdoji.local`;
};

export default function AuthScreen({ supabase, brandTitle = '청도지 WORKSPACE' }) {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [role, setRole] = useState('매니저');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const resetMessages = () => {
    setError('');
    setNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('아이디(본인 이름)를 입력해 주세요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자리 이상 입력해 주세요.');
      return;
    }

    const email = nameToAuthEmail(trimmedName);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) {
          if (/Invalid login credentials/i.test(signInError.message)) {
            setError('등록되지 않은 이름이거나 비밀번호가 일치하지 않습니다.');
          } else {
            setError(signInError.message);
          }
        }
      } else {
        if (password !== passwordConfirm) {
          setError('비밀번호 확인이 일치하지 않습니다.');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: trimmedName,
              role
            }
          }
        });

        if (signUpError) {
          if (/already registered/i.test(signUpError.message)) {
            setError('이미 등록된 이름입니다. 로그인 화면에서 접속해 주세요.');
          } else {
            setError(signUpError.message);
          }
        } else if (data?.session) {
          // Confirm email이 꺼져 있으면 가입과 동시에 자동 로그인됨
          setNotice(`${trimmedName}님, 회원가입이 완료되었습니다.`);
        } else {
          // Confirm email이 켜져 있는 경우 안내
          setNotice('계정이 생성되었습니다. 로그인 버튼을 눌러 접속해 주세요.');
          setMode('login');
          setPassword('');
          setPasswordConfirm('');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-mark">청</div>
        <p className="eyebrow">TEAM WORKSPACE ACCESS</p>
        <h1>{brandTitle}</h1>
        <p className="muted">
          {mode === 'login'
            ? '등록된 본인 이름(아이디)과 비밀번호로 로그인하세요.'
            : '워크스페이스에서 사용할 이름(아이디)과 비밀번호를 등록합니다.'}
        </p>

        {error && (
          <div className="alert" style={{ marginTop: '14px', textAlign: 'left' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="auth-notice">
            <CheckCircle2 size={16} />
            <span>{notice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            아이디 (본인 이름)
            <input
              type="text"
              placeholder="예: 홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="username"
              required
            />
          </label>

          {mode === 'signup' && (
            <label>
              직책 구분
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="매니저">매니저</option>
                <option value="선임 매니저">선임 매니저</option>
              </select>
            </label>
          )}

          <label>
            비밀번호 (6자리 이상)
            <input
              type="password"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {mode === 'signup' && (
            <label>
              비밀번호 확인
              <input
                type="password"
                placeholder="비밀번호 한 번 더 입력"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </label>
          )}

          <button type="submit" className="primary auth-submit-btn" disabled={loading}>
            {mode === 'login' ? (
              <>
                <LogIn size={17} />
                <span>{loading ? '로그인 중...' : '로그인'}</span>
              </>
            ) : (
              <>
                <UserPlus size={17} />
                <span>{loading ? '가입 처리 중...' : '회원가입 완료'}</span>
              </>
            )}
          </button>
        </form>

        <div className="auth-switch-box">
          {mode === 'login' ? (
            <>
              <span>아직 계정이 없으신가요?</span>
              <button
                type="button"
                className="secondary auth-switch-btn"
                onClick={() => {
                  resetMessages();
                  setPassword('');
                  setPasswordConfirm('');
                  setMode('signup');
                }}
              >
                <UserPlus size={15} /> 회원가입
              </button>
            </>
          ) : (
            <>
              <span>이미 계정을 등록하셨나요?</span>
              <button
                type="button"
                className="secondary auth-switch-btn"
                onClick={() => {
                  resetMessages();
                  setPassword('');
                  setPasswordConfirm('');
                  setMode('login');
                }}
              >
                <LogIn size={15} /> 로그인으로 돌아가기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}