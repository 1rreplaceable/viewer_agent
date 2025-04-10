# 📂 Viewer Agent

로컬에서 파일을 열고 변경 사항을 자동으로 감지하여 서버에 업로드하는 Electron 기반 에이전트입니다.

> 이 프로젝트는 문서 관리 시스템과 연동되어 사용되며, 클라이언트가 파일을 다운로드해 로컬에서 열람하고 수정한 뒤, 해당 파일을 자동으로 서버에 업로드하도록 지원합니다.

---

## 🚀 주요 기능

- Electron 트레이 앱으로 백그라운드에서 실행
- 중복 실행 방지 (`app.requestSingleInstanceLock()` 사용)
- 자동 시작 설정 (`app.setLoginItemSettings()`)
- 파일 저장 감지 후 자동 업로드 (`chokidar` 사용)
- Express 기반 로컬 서버를 통한 파일 열기 요청 수신
- OS에 맞는 기본 앱으로 파일 열기 (Windows/macOS/Linux 지원)
- 파일 변경 시 서버에 PUT 요청 전송하여 업데이트

---

## 🛠️ 설치 및 실행

### 1. 설치
```bash
npm install
```

### 2. 실행
```bash
npm start
```

### 3. 빌드 (선택사항)
```bash
npm run build
```

---

## 📂 사용 흐름

1. `/upload` API로 파일 열기 요청 수신
2. 파일을 다운로드하여 로컬에 저장
3. 해당 파일을 기본 앱으로 실행
4. 사용자가 파일을 저장하면 자동으로 서버에 업로드

---

## 📁 예시 요청

```http
POST http://localhost:45678/upload
Content-Type: application/json

{
  "file": {
    "id": "파일ID",
    "s3Url": "https://your-s3-bucket.com/file.docx",
    "fileHistoryList": []
  },
  "user": {
    "email": "user@example.com"
  }
}
```

---

## 📎 기술 스택

- **Electron**: 데스크탑 애플리케이션
- **Express**: 로컬 API 서버
- **Chokidar**: 파일 변경 감지
- **Axios**: 서버 통신
- **Node.js**: 런타임 환경

---

## ✅ 기타 기능

- macOS: Dock 아이콘 설정 및 트레이 등록
- 다중 실행 방지 및 알림 메시지 표시
- 자동 로그인 시작 옵션 활성화
- 임시 폴더 경로에 파일 저장 후 오픈

---

## 📌 주의사항

- Viewer Agent는 단독 사용보다는 웹 문서 시스템과의 연동을 전제로 설계되었습니다.
- 로컬에서 파일을 안전하게 열고 저장 변경사항을 서버에 반영하는 데 목적이 있습니다.

---

