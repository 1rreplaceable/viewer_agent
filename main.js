// main.js
const { app, Tray, Menu, nativeImage, Notification } = require("electron");
const path = require("path");
const { startAgentServer } = require("./agent-server");

let tray = null;

app.whenReady().then(() => {
  if (process.platform === "darwin") {
    const dockIconPath = path.join(__dirname, "doc.png"); // 원하는 이미지 경로
    const dockIcon = nativeImage.createFromPath(dockIconPath);
  
    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon);
    } else {
      console.error("❌ Dock 아이콘 로딩 실패:", dockIconPath);
    }
  }
  

  startAgentServer();

  // 아이콘 경로 설정 (Mac용 전용 아이콘)
  const iconPath = path.join(__dirname, process.platform === "darwin" ? "doc.png" : "doc.png");

  let trayIcon = nativeImage.createFromPath(iconPath);

  // 아이콘이 로드되지 않았을 경우 확인
  if (trayIcon.isEmpty()) {
      console.error("❌ 트레이 아이콘 이미지 로딩 실패:", iconPath);
      return;
  }

  // macOS 상단 메뉴바용 템플릿 이미지 설정
  if (process.platform === "darwin") {
      // trayIcon.setTemplateImage(true);
  }
  tray = new Tray(trayIcon);
  console.log('tray :>> ', tray);
  const contextMenu = Menu.buildFromTemplate([
      { label: "Agent 실행 중", enabled: false },
      { label: "종료", click: () => app.quit() },
  ]);
  console.log("🧪 iconPath:", iconPath);
  console.log("🧪 trayIcon.isEmpty():", trayIcon.isEmpty());
  
  tray.setToolTip("Viewer Agent 실행 중");
  tray.setContextMenu(contextMenu);
});

