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
        const destPath = path.join(uploadDir, fileName);

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
        let command, args;

        if (platform === "win32") {
            command = "start";
            args = [filePath];
        } else if (platform === "darwin") {
            command = "open";
            args = [filePath];
        } else {
            command = "xdg-open";
            args = [filePath];
        }

        spawn(command, args, { shell: true });
        console.log("📂 파일 열기 시작:", filePath);
        await axios.put(`https://share-docs-api.neulgo.com/api/v1/files/${fileId}/lock?value=true`);
        console.log("🔒 파일 열기 → 락 설정 완료");
        // 파일 저장 감지 + 일정 시간 후 락 해제
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
            const filePath = await downloadAndSaveFile(file.s3Url);
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
