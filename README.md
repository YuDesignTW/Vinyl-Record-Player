# slowly. 黑膠播放器

React + Vite 前端，以 Vinylacy 配置器的 Color／封套頁面為視覺與動態參考。

## 開發

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 4173
npm test
npm run build
npm run test:sites
```

建置輸出在 `dist/client`，並保留 Sites worker 與 hosting 設定。

## 功能

- 唱片庫：多張唱片存檔、更新、切換；未儲存變更提示。
- IndexedDB 保存音檔 Blob、歌曲順序、標籤與封套圖片，重新整理後還原。
- 外觀：獨立置中的 A／B 標籤；雙片加入 C／D；文字、圖片與顏色皆可編輯。
- 單片／雙片 3D 紙封套、正背面設計、兩個外側開口與抽出唱片控制。
- 音樂：本機匯入／拖放、同面拖曳排序、鍵盤排序與移除。
- 聆聽：播放、暫停、進度、音量、切歌、整面循環與 33⅓／45 RPM 視覺轉速。
- Three.js 幾何唱片與封套、雙面遮擋、拖曳觀看角度、連續插值轉場。
- Liquid Glass 面板、分頁高度過渡、隱藏捲軸、響應式布局與減少動態支援。

## 資料與素材

- 資料僅存於目前瀏覽器及網站來源；清除網站資料會移除收藏，無帳號或跨裝置同步。
- 音檔、圖片不會上傳。瀏覽器容量不足會顯示儲存失敗。
- 唱片表面使用本次 ImageGen 素材，反光烘焙於紋理，非物理材質即時反射。
- slow-sunday.wav 為 24 秒原創合成試聽音景；圖示使用 lucide-react。
- 瀏覽器實測、參考差異與驗證限制見 [design-qa.md](design-qa.md)。

## 本機永久存檔

使用 `npm run dev -- --host 127.0.0.1 --port 4173`，開啟 `http://localhost:4173`。
開發服務會將唱片、封面、音檔及 YouTube 曲目自動寫入 `.local-data/records/`，
每張唱片一份 JSON（音檔內嵌）；畫面顯示「已存到本機」後即可安全刷新或關閉。
重新啟動同一個專案，即使瀏覽器資料已清除或換了連接埠，仍會讀取這份收藏。
已有的 IndexedDB 收藏會自動補入本機資料夾，不會覆蓋同 ID 的本機唱片。

請保留 `.local-data`；備份時複製整個資料夾即可。此目錄不加入版本控制或網站發布。
單張唱片存檔上限為 256 MB（包含編碼後音檔）；超出或磁碟寫入失敗會顯示儲存失敗。
本機 API 僅接受 localhost / 127.0.0.1 / ::1 的同來源請求。
`npm run build` 的靜態網站與 `npm run preview` 仍使用瀏覽器 IndexedDB；磁碟存檔需使用上述開發服務。

YouTube 播放請使用 `localhost` 入口。從 `127.0.0.1` 開啟時，程式會先搬入舊瀏覽器收藏，再自動導向 `localhost`，避免部分影片拒絕 IP 來源的嵌入播放。
