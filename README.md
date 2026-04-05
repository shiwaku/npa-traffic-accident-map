# 警察庁 交通事故マップ


## 技術スタック
- [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/) v5.22.0
- [PMTiles](https://protomaps.com/docs/pmtiles) v4
- [@maplibre/maplibre-gl-geocoder](https://github.com/maplibre/maplibre-gl-geocoder) v1
- [@watergis/maplibre-gl-terradraw](https://github.com/watergis/maplibre-gl-terradraw) v1
- [Vite](https://vitejs.dev/) v5
- [TypeScript](https://www.typescriptlang.org/) v5
- Node.js v20+

## セットアップ

```bash
# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev

# プロダクションビルド
npm run build
```

## データソース

### 警察庁
- 警察庁 交通事故統計情報のオープンデータ（2019年、2020年、2021年、2022年、2023年、2024年）
    - 出典：https://github.com/shiwaku/npa-traffic-accident-pmtiles
        - 原初データ出典：[交通事故統計情報のオープンデータ](https://www.npa.go.jp/publications/statistics/koutsuu/opendata/index_opendata.html)
        - ライセンス：警察庁Webサイトの[利用規約](https://www.npa.go.jp/rules/index.html)を参照。
    - 概要：警察庁が公開している、交通事故統計情報のオープンデータ（2019年、2020年、2021年、2022年、2023年、2024年）の本票をPMTiles形式に変換したデータです。

### 国土交通省
- 国土数値情報 学校データ（令和3年）
    - 出典：https://xs489works.xsrv.jp/pmtiles-data/traffic-accident/P29-21_primary_school.pmtiles
        - 原初データ出典：[学校データ](https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-P29-v2_0.html)
        - ライセンス：[国土数値情報ダウンロードサイトコンテンツ利用規約（政府標準利用規約準拠版）](https://nlftp.mlit.go.jp/ksj/other/agreement.html)を参照。
    - 概要：国土交通省が国土数値情報ダウンロードサイトにて公開している、学校データ（令和3年）をPMTiles形式に変換したデータです。

### 日本道路交通情報センター(JARTIC)
- オープンデータ「交通規制情報」
    - 出典：https://xs489works.xsrv.jp/pmtiles-data/traffic-accident/jartic_kisei_202507_polygons_code114.pmtiles
        - 原初データ出典：[オープンデータ「交通規制情報」](https://www.jartic.or.jp/)
        - ライセンス：[利用規約](https://www.jartic.or.jp/d/opendata/riyou_kiyaku.pdf)を参照。
    - 概要：日本道路交通情報センター(JARTIC)がオープンデータとして公開している、交通規制情報（2025年7月版）をPMTiles形式に変換したデータです。
