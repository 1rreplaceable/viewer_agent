const { app, Tray, Menu, nativeImage, Notification, dialog } = require("electron");
const path = require("path");
const { startAgentServer } = require("./agent-server");
const { autoUpdater } = require("electron-updater");

let tray = null;

// 💡 중복 실행 방지
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.whenReady().then(() => {
        autoUpdater.autoDownload = false;

        // ✨ 업데이트 확인
        autoUpdater.checkForUpdates();

        // 📦 업데이트 가능한 경우 → 사용자에게 다운로드할지 물어봄
        autoUpdater.on("update-available", () => {
            dialog
                .showMessageBox({
                    type: "info",
                    title: "업데이트 확인",
                    message: "새로운 버전이 있습니다. 지금 다운로드 하시겠습니까?",
                    buttons: ["예", "아니오"],
                    defaultId: 0,
                    cancelId: 1,
                })
                .then(result => {
                    if (result.response === 0) {
                        autoUpdater.downloadUpdate();
                    }
                });
        });

        // ✅ 다운로드 완료 → 재시작 안내
        autoUpdater.on("update-downloaded", () => {
            dialog
                .showMessageBox({
                    type: "info",
                    title: "업데이트 완료",
                    message: "새로운 버전이 다운로드되었습니다.\n확인을 누르면 앱이 재시작됩니다.",
                    buttons: ["확인"],
                })
                .then(() => {
                    autoUpdater.quitAndInstall();
                });
        });
        if (process.platform === "darwin") {
            const dockIconPath = path.join(__dirname, "doc.png"); // 원하는 이미지 경로
            const dockIcon = nativeImage.createFromPath(dockIconPath);

            if (!dockIcon.isEmpty()) {
                app.dock.setIcon(dockIcon);
            } else {
                console.error("❌ Dock 아이콘 로딩 실패:", dockIconPath);
            }
        }

        app.setLoginItemSettings({ openAtLogin: true });

        // 🧩 실제 에이전트 서버 실행
        startAgentServer();

        const iconPath = path.join(
            __dirname,
            process.platform === "darwin" ? "doc.png" : "doc.png",
        );
        let trayIcon = nativeImage.createFromPath(iconPath);

        if (trayIcon.isEmpty()) {
            console.error("❌ 트레이 아이콘 이미지 로딩 실패:", iconPath);
            return;
        }

        tray = new Tray(trayIcon);
        const contextMenu = Menu.buildFromTemplate([
            { label: "Agent 실행 중", enabled: false },
            { label: "종료", click: () => app.quit() },
        ]);

        tray.setToolTip("Viewer Agent 실행 중 1.0.1");
        tray.setContextMenu(contextMenu);
    });

    // 💡 두 번째 인스턴스가 실행되었을 때의 이벤트 핸들링 (선택 사항)
    app.on("second-instance", () => {
        // 필요 시 포커스 처리 or 트레이 메시지
        console.log("🚫 중복 실행 시도 감지");
        new Notification({
            title: "Viewer Agent",
            body: "에이전트는 이미 실행 중입니다.",
        }).show();
    });
}
