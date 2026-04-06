# CLAUDE.md

## プロジェクト概要
警察庁の交通事故統計オープンデータを MapLibre GL JS で可視化する Web マップアプリ。

## 技術スタック
- **言語**: TypeScript
- **ビルドツール**: Vite v5
- **マップ**: MapLibre GL JS v5.22
- **タイル形式**: PMTiles v4
- **ジオコーダー**: @maplibre/maplibre-gl-geocoder
- **描画ツール**: @watergis/maplibre-gl-terradraw
- **Node.js**: v24+

## ディレクトリ構成
```
├── src/
│   ├── main.ts       # エントリーポイント
│   └── style.css     # スタイル
├── public/
│   ├── pale.json     # ベースマップスタイル（国土地理院 淡色地図）
│   └── favicon.svg
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.js
└── .github/workflows/deploy.yml  # GitHub Pages 自動デプロイ
```

## 開発コマンド
```bash
npm install   # 依存パッケージのインストール
npm run dev   # 開発サーバー起動（ブラウザ自動オープン）
npm run build # プロダクションビルド
```

## デプロイ
- `main` ブランチへの push で GitHub Actions が自動ビルド・デプロイ
- 公開 URL: https://shiwaku.github.io/npa-traffic-accident-map/

## 重要な設定

### Vite base パス
`vite.config.js` に `base: "/npa-traffic-accident-map/"` を設定済み。
`public/` 内のファイルを参照する際は必ず `import.meta.env.BASE_URL` を使うこと。
```ts
// NG
style: "/pale.json"
// OK
style: `${import.meta.env.BASE_URL}pale.json`
```

### PMTiles プロトコル
pmtiles v4 + maplibre-gl v5 の組み合わせ。
```ts
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile.bind(protocol));
```

### CSP ワーカー
Vite + MapLibre GL v5 のワーカー問題を `setWorkerUrl()` で解決済み。
```ts
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-csp-worker?url";
setWorkerUrl(maplibreWorkerUrl);
```

### ピア依存関係
`@maplibre/maplibre-gl-geocoder` の peer deps 競合を `.npmrc` で回避。
```
legacy-peer-deps=true
```

## データソース（PMTiles）
| レイヤー | URL |
|---|---|
| 交通事故（2019-2024年） | `pmtiles://https://xs489works.xsrv.jp/pmtiles-data/traffic-accident/honhyo_2019-2024_convert.pmtiles` |
| 交通規制（ゾーン30等） | `pmtiles://https://xs489works.xsrv.jp/pmtiles-data/traffic-accident/jartic_kisei_202507_polygons_code114.pmtiles` |
| 小学校 | `pmtiles://https://xs489works.xsrv.jp/pmtiles-data/traffic-accident/P29-21_primary_school.pmtiles` |
