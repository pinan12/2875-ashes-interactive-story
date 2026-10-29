# 第一次 GitHub 上線與 ConoHa 串接：逐項勾選清單

## A. 在 GitHub 上傳之前

- [ ] 我已確認 `2875fp.bopi365.com` 的後台可以登入，且沒有要重裝後台或覆蓋資料庫。
- [ ] 我已備份現有 ConoHa `PUBLIC`、`PRIVATE`、MySQL（涉及後台資料時）。
- [ ] 草稿與測試環境已審核擴充版 JSON，`prod` 已正式發布 `afterglow-2875` 故事。
- [ ] 故事 JSON 中所有正式場景圖片 URL 已在 ConoHa `/uploads/` 真實存在（E01 暫用 2875_12.webp 已知不是日出專圖）。
- [ ] GitHub **正式上傳包**內不存在 `data/preview-story.json`、PHP 後台、`PRIVATE/`、SQL 備份或任何密碼。
- [ ] 請使用 GitHub **正式上傳包**，而不是 LOCAL-TEST-ONLY 測試包。

## B. 第一次部署 GitHub Pages

- [ ] 已建立 GitHub Repository，並把 `index.html` 放在 Repository 根目錄。
- [ ] 已一起上傳 `app.js`、`config.js`、`styles.css`、`preflight.html`、`.nojekyll`、`assets/scenes/`。
- [ ] Settings → Pages → Deploy from a branch → `main` → `/ (root)` → Save。
- [ ] 等 Pages 部署完成後，`https://GITHUB帳號.github.io/REPO/` 能顯示首頁。

## C. 連結 ConoHa

- [ ] 後台 API 跨站設定加入 `https://GITHUB帳號.github.io`（不含 `/REPO`、不含尾端 `/`）。
- [ ] 後台公開首頁設定 `game_entry_url` 填入完整 GitHub Pages 網址（包含 `/REPO/`）。
- [ ] `https://GITHUB帳號.github.io/REPO/preflight.html` 健康檢查、故事、分支、起點與圖片均顯示成功。
- [ ] 遊戲首頁顯示「開始故事」，可進入 S01，且按選項有黑幕遮罩而非畫面直接跳換。

## D. 完整遊戲驗收（三條路都要玩）

- [ ] E01：研究員／或前線路線 → S07 繞路 → S08 主通道 → E01。
- [ ] E02：另一個職業分支 → S07 繞路 → S08 側門 → E02。
- [ ] E03：S07 冒險衝進大廳 → S07H 讀日記 → E03（未出現 C05）。
- [ ] 後台玩家紀錄新增這 3 次 run；每一筆的事件、結局和 revision 正確。
- [ ] F5 重新整理後可恢復同一分頁正在進行的遊玩。
- [ ] 重新開始、再次遊玩及結局紀錄下載可正常操作。
- [ ] 桌面及手機都能操作，沒有水平溢位、重疊、錯誤圖片或滾輪異常。
- [ ] 在網路斷線／API 錯誤情境，頁面能清楚提示，且不會跳到錯誤分支。

## E. 對外提交前最後一關

- [ ] 所有正式劇情與圖片均經過作者確認（包括 E01 日出圖的替換或明確標註暫圖）。
- [ ] 老師要求的 GitHub Repository 連結確實可公開開啟，Pages 連結可進入遊戲。
- [ ] 報告區分「已有功能」、「已完成本機驗證」、「已完成 ConoHa 實機驗證」；不把尚未測的資料庫與跨站功能宣稱已測。
- [ ] 題目期限前有保留可回復的穩定版本（建議 Git tag：`v0.3.1-first-release`）。
