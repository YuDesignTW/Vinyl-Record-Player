#!/bin/zsh
cd -- "${0:A:h}" || exit 1
if ! command -v npm >/dev/null 2>&1; then
  print '找不到 npm，請先安裝 Node.js，再重新開啟此檔案。'
  read '?按 Enter 關閉…'
  exit 1
fi
if [[ ! -d node_modules ]]; then
  npm ci || { read '?安裝失敗，按 Enter 關閉…'; exit 1; }
fi
print 'hMusic：http://localhost:4173'
print '啟動後請在瀏覽器開啟上方網址；按 Control+C 停止。'
npm start
result=$?
if (( result != 0 )); then
  print '如果連接埠已使用，請先開啟 http://localhost:4173 確認既有服務。'
  read '?按 Enter 關閉…'
fi
exit $result
