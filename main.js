const { app, Tray, Menu, nativeImage, Notification } = require("electron");
const path = require("path");
const { startAgentServer } = require("./agent-server");

let tray = null;

// 💡 중복 실행 방지
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    console.log("⚠️ 이미 실행 중인 에이전트가 있습니다. 종료합니다.");
    app.quit();
} else {
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

        tray.setToolTip("Viewer Agent 실행 중");
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
