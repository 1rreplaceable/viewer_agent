const chokidar = require("chokidar");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const AUTO_UNLOCK_TIMEOUT = 2 * 60 * 1000;

function watchFileSave(filePath, fileId, userEmail) {
    const watcher = chokidar.watch(filePath, {
        persistent: true,
        usePolling: true,
        interval: 1000,
    });
    let lastModified = Date.now();
    let lockReleased = false;
    watcher.on("change", async () => {
        lastModified = Date.now();

        console.log(`💾 파일 저장 감지됨: ${filePath}`);

        const formData = new FormData();
        formData.append("file", fs.createReadStream(filePath));

        try {
            await axios.put(`https://share-docs-api.neulgo.com/api/v1/files/${fileId}`, formData, {
                headers: {
                    ...formData.getHeaders(),
                    email: userEmail,
                },
            });
            console.log("📤 저장 완료 → 서버로 전송됨");
        } catch (err) {
            console.error("❌ 저장 전송 실패:", err.message);
        }
    });
    const interval = setInterval(async () => {
        const now = Date.now();
        const elapsed = now - lastModified;

        if (!lockReleased && elapsed > AUTO_UNLOCK_TIMEOUT) {
            try {
                await axios.put(`https://share-docs-api.neulgo.com/api/v1/files/${fileId}/lock?value=false`);
                console.log(`🔓 ${AUTO_UNLOCK_TIMEOUT / 1000}초 이상 저장 없음 → 락 해제 완료`);

                lockReleased = true;
                watcher.close();
                clearInterval(interval);
            } catch (err) {
                console.error("❌ 락 해제 실패:", err.message);
            }
        }
    }, 5000);
}

module.exports = { watchFileSave };
