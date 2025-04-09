const chokidar = require("chokidar");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

function watchFileSave(filePath, fileId, userEmail) {
    const watcher = chokidar.watch(filePath, {
        persistent: true,
        usePolling: true,
        interval: 1000,
    });
    let lastModified = Date.now();
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
}

module.exports = { watchFileSave };
