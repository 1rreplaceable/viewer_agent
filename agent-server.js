const { shell, app } = require("electron");
const express = require("express");
const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const cors = require("cors");
const { watchFileSave } = require("./watcher/watchFileSave");
const { spawn } = require("child_process");

function startAgentServer() {
    const appServer = express();
    const port = 45678;

    appServer.use(express.json());
    appServer.use(cors());

    // 임시 저장 경로
    const uploadDir = path.join(os.tmpdir(), "viewer-agent-files");
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 🔽 파일 다운로드 함수
    async function downloadAndSaveFile(fileUrl) {
        const fileName = path.basename(fileUrl);
        const uniqueName = `${Date.now()}-${fileName}`;
        const destPath = path.join(uploadDir, uniqueName);
        const writer = fs.createWriteStream(destPath);
        const response = await axios({ method: "GET", url: fileUrl, responseType: "stream" });
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on("finish", () => {
                console.log("✅ 파일 다운로드 완료:", destPath);
                resolve(destPath);
            });
            writer.on("error", err => {
                console.error("❌ 다운로드 중 오류:", err);
                reject(err);
            });
        });
    }

    // 📂 파일 열기 + 저장 감지 시작
    async function openFileWithWatcher(filePath, fileId, userEmail) {
        const platform = process.platform;
        if (platform === "win32") {
            const command = `start "" "${filePath}"`;
            spawn(command, {
                shell: true,
                windowsHide: true,
            });
        } else if (platform === "darwin") {
            spawn("open", [filePath]);
        } else {
            spawn("xdg-open", [filePath]);
        }

        console.log("📂 파일 열기 시작:", filePath);
        watchFileSave(filePath, fileId, userEmail);
    }

    appServer.post("/upload", async (req, res) => {
        const { file, user } = req.body;
        console.log("🧾 파일 정보:", file?.id, file?.s3Url);
        console.log("👤 유저 정보:", user?.email);

        if (!file?.s3Url) {
            return res.status(400).json({ status: "error", message: "url 없음" });
        }

        try {
            const url = file.fileHistoryList.length < 1 ? file.s3Url : file.fileHistoryList[0].s3Url;
            const filePath = await downloadAndSaveFile(url);
            await new Promise(resolve => setTimeout(resolve, 300));

            await openFileWithWatcher(filePath, file.id, user.email);
            res.json({ status: "success", message: "파일 열기 완료", path: filePath });
        } catch (err) {
            res.status(500).json({
                status: "error",
                message: "파일 열기 실패",
                error: err.toString(),
            });
        }
    });

    appServer.get("/ping", (req, res) => {
        res.send("pong");
    });

    appServer.listen(port, () => {
        console.log(`🚀 Agent 서버 실행 중: http://localhost:${port}`);
    });
}

module.exports = { startAgentServer };
