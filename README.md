# 청도지 WORKSPACE (MVP)

청도지 사업단 5~10명 팀 사용을 목표로 한 독립형 업무 관리 웹앱 초기 버전입니다.

## 포함 기능
- 이메일/비밀번호 로그인 (관리자 초대 계정 전용)
- 대시보드 요약
- 일정 월간 달력 및 일정 등록/수정
- 참여자 등록/수정/삭제
- 출결 등록/수정/삭제
- 상담 이력 등록/수정/삭제
- 수료자 사후관리 등록/수정/삭제
- 기초 성과 통계
- Supabase Realtime 변경 감지
- 팀 멤버 인증 기반 RLS 정책

## 실행 준비
1. https://supabase.com 에서 프로젝트를 생성합니다.
2. Supabase SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
3. Project Settings → API에서 Project URL과 Publishable key (또는 legacy anon public key)를 확인합니다.
4. 프로젝트 루트에 `.env` 파일을 만들고 아래 값을 입력합니다.

```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

5. 실행합니다.

```
npm install
npm run dev
```

## 팀원 초대/권한
- Supabase Authentication 설정에서 공개 회원가입을 비활성화하고, 관리자가 팀원을 이메일 초대 방식으로 추가하세요.
- 초대된 계정은 `team_members`에 기본 `member`로 생성됩니다. 공개 회원가입을 열어두면 외부인이 팀 데이터에 접근할 수 있으므로 금지합니다.
- 첫 관리자 계정은 Supabase Authentication → Users에서 UUID를 확인한 뒤 SQL Editor에서 다음을 실행합니다.

```
update public.team_members set role='admin' where user_id='실제-관리자-UUID';
```

현재 MVP에서는 초대된 팀 멤버 모두가 업무 데이터를 공동으로 열람·수정할 수 있도록 구성했습니다. 상담기록에는 민감한 개인정보가 포함될 수 있으므로 실제 운영 전 상담기록 접근 권한을 별도로 제한하는 것을 권장합니다. 관리자/일반 팀원별 세부 권한과 감사로그도 정식 운영 전 보강해야 합니다.

## 중요 운영 전 확인사항
- 실제 참여자 개인정보 및 상담 내용 입력 전, 사업단의 개인정보 처리 기준과 내부 승인 절차를 확인하세요.
- 현재는 기본적인 팀 인증 및 RLS가 적용된 MVP입니다. 상담기록 접근 범위, 개인정보 보유기간, 백업, 감사로그, 관리자 승인 초대 등은 정식 운영 전 보강이 필요합니다.
- 이 앱은 아직 인터넷에 배포된 상태가 아닙니다. Supabase 프로젝트 연결과 호스팅 배포가 완료되어야 팀원들이 공통 URL로 접속할 수 있습니다.


## 주의
- 브라우저에 노출되는 키에는 Publishable key(또는 anon public key)만 사용하세요. Secret/service_role 키는 절대 `.env`의 VITE_ 변수에 넣지 마세요.
- `.env` 파일은 프로젝트 루트(package.json이 있는 폴더)에 만들고, 값을 저장한 뒤 개발 서버를 재시작하세요.
- `supabase/schema.sql`은 SQL Editor에서 실행하는 스키마 파일이며, 브라우저 코드에 붙여넣는 파일이 아닙니다.
