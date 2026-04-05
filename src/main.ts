/// <reference types="vite/client" />
import maplibregl, { MapMouseEvent, setWorkerUrl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-csp-worker?url";
import { Protocol } from "pmtiles";

// Vite + MapLibre GL CSP ワーカーの URL を明示的に指定
setWorkerUrl(maplibreWorkerUrl);
import MaplibreGeocoder, {
  MaplibreGeocoderApiConfig,
  MaplibreGeocoderFeatureResults,
} from "@maplibre/maplibre-gl-geocoder";
import "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css";
import { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";
import "./style.css";

// PMTiles プロトコルの設定
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile.bind(protocol));

// マップの初期化
const map = new maplibregl.Map({
  container: "map",
  style: `${import.meta.env.BASE_URL}pale.json`,
  zoom: 15,
  maxZoom: 23,
  minZoom: 4,
  center: [139.487748, 35.922752],
  hash: true,
  attributionControl: false,
});

// ズーム・回転
map.addControl(new maplibregl.NavigationControl());

// フルスクリーンモード
map.addControl(new maplibregl.FullscreenControl());

// 現在位置表示
map.addControl(
  new maplibregl.GeolocateControl({
    positionOptions: { enableHighAccuracy: false },
    fitBoundsOptions: { maxZoom: 18 },
    trackUserLocation: true,
    showUserLocation: true,
  })
);

// スケール表示
map.addControl(
  new maplibregl.ScaleControl({ maxWidth: 200, unit: "metric" })
);

// Attribution（折りたたみ）
map.addControl(
  new maplibregl.AttributionControl({
    compact: true,
    customAttribution:
      '<a href="https://github.com/shiwaku/npa-traffic-accident-map-on-maplibre" target="_blank">GitHub</a>',
  })
);

// ジオコーダー（国土地理院 地名検索API）
const geocoderApi = {
  forwardGeocode: async (
    config: MaplibreGeocoderApiConfig
  ): Promise<MaplibreGeocoderFeatureResults> => {
    const features: MaplibreGeocoderFeatureResults["features"] = [];
    const query = typeof config.query === "string" ? config.query : "";
    const textPrefix = query.substring(0, 3);
    try {
      const response = await fetch(
        `https://msearch.gsi.go.jp/address-search/AddressSearch?q=${query}`
      );
      const geojson = await response.json();
      for (const item of geojson) {
        if (item.properties.title.indexOf(textPrefix) !== -1) {
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: item.geometry.coordinates },
            place_name: item.properties.title,
            properties: item.properties,
            text: item.properties.title,
            place_type: ["place"],
            center: item.geometry.coordinates,
          });
        }
      }
    } catch (e) {
      console.error(`Failed to forwardGeocode with error: ${e}`);
    }
    return { type: "FeatureCollection", features };
  },
};
map.addControl(
  new MaplibreGeocoder(geocoderApi, { maplibregl }),
  "top-left"
);

// TerraDraw
const draw = new MaplibreTerradrawControl({
  modes: [
    "render",
    "point",
    "linestring",
    "polygon",
    "rectangle",
    "circle",
    "freehand",
    "angled-rectangle",
    "sensor",
    "sector",
    "select",
    "delete-selection",
    "delete",
    "download",
  ],
  open: false,
});
map.addControl(draw, "top-right");

// マップロード後の処理
map.on("load", () => {
  // 全国最新写真（シームレス）
  map.addSource("seamlessphoto", {
    type: "raster",
    tiles: [
      "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
    ],
    tileSize: 256,
    attribution:
      '<a href="https://maps.gsi.go.jp/development/ichiran.html#seamlessphoto">全国最新写真（シームレス）</a>',
  });
  map.addLayer({
    id: "seamlessphoto",
    type: "raster",
    source: "seamlessphoto",
    minzoom: 14,
    maxzoom: 23,
  });

  // 空中写真 不透明度スライダー
  const sliderOpacity = document.getElementById(
    "slider-opacity"
  ) as HTMLInputElement;
  const sliderOpacityValue = document.getElementById(
    "slider-opacity-value"
  ) as HTMLSpanElement;
  map.setPaintProperty("seamlessphoto", "raster-opacity", 0.5);
  sliderOpacity.addEventListener("input", (e) => {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
    map.setPaintProperty("seamlessphoto", "raster-opacity", value / 100);
    sliderOpacityValue.textContent = `${value}%`;
  });

  // ゾーン30（交通規制）ソース
  map.addSource("pmtiles-kisei", {
    type: "vector",
    url: "pmtiles://https://xs489works.xsrv.jp/pmtiles-data/traffic-accident/jartic_kisei_202507_polygons_code114.pmtiles",
    attribution:
      '<a href="https://www.jartic.or.jp/">日本道路交通情報センター(JARTIC)オープンデータ「交通規制情報」を加工して作成</a>',
  });
  map.addLayer({
    id: "kisei-fill",
    type: "fill",
    source: "pmtiles-kisei",
    "source-layer": "jartic_kisei_202507_polygons_code114",
    minzoom: 12,
    maxzoom: 23,
    paint: {
      "fill-color": "rgba(45, 186, 118, 1)",
      "fill-opacity": 0.2,
    },
  });
  map.addLayer({
    id: "kisei-line",
    type: "line",
    source: "pmtiles-kisei",
    "source-layer": "jartic_kisei_202507_polygons_code114",
    minzoom: 12,
    maxzoom: 23,
    layout: { "line-join": "round", "line-cap": "round" },
    paint: {
      "line-color": "rgba(45, 186, 118, 1)",
      "line-opacity": 1,
    },
  });

  // 交通事故データ
  map.addSource("pmtiles-jiko", {
    type: "vector",
    url: "pmtiles://https://xs489works.xsrv.jp/pmtiles-data/traffic-accident/honhyo_2019-2024_convert.pmtiles",
    attribution:
      '<a href="https://www.npa.go.jp/publications/statistics/koutsuu/opendata/index_opendata.html">警察庁 交通事故統計情報のオープンデータ（2019～2024年）（警察庁Webサイト）を加工して作成</a>',
  });

  // 負傷事故レイヤ
  map.addLayer({
    id: "fushoujiko-1",
    source: "pmtiles-jiko",
    "source-layer": "honhyo_20192024_convert",
    type: "circle",
    paint: { "circle-color": "#FFFFFF", "circle-radius": 8 },
  });
  map.addLayer({
    id: "fushoujiko-2",
    source: "pmtiles-jiko",
    "source-layer": "honhyo_20192024_convert",
    type: "circle",
    paint: { "circle-color": "#003FFF", "circle-radius": 6 },
  });
  map.addLayer({
    id: "fushoujiko-label",
    type: "symbol",
    source: "pmtiles-jiko",
    "source-layer": "honhyo_20192024_convert",
    minzoom: 16,
    maxzoom: 23,
    layout: {
      "text-field": [
        "concat",
        ["get", "発生日時_年"],
        "/",
        ["get", "発生日時_月"],
        "/",
        ["get", "発生日時_日"],
      ],
      "text-font": ["NotoSansJP-Regular"],
      "text-offset": [0, -1.2],
      "text-allow-overlap": true,
      "text-size": 12,
    },
    paint: {
      "text-color": "rgba(0, 0, 255, 1)",
      "text-halo-color": "rgba(255, 255, 255, 1)",
      "text-halo-width": 1,
    },
  });
  map.setFilter("fushoujiko-1", ["==", "事故内容", "負傷事故"]);
  map.setFilter("fushoujiko-2", ["==", "事故内容", "負傷事故"]);
  map.setFilter("fushoujiko-label", ["==", "事故内容", "負傷事故"]);

  // 死亡事故レイヤ
  map.addLayer({
    id: "shiboujiko-1",
    source: "pmtiles-jiko",
    "source-layer": "honhyo_20192024_convert",
    type: "circle",
    paint: { "circle-color": "#FFFFFF", "circle-radius": 8 },
  });
  map.addLayer({
    id: "shiboujiko-2",
    source: "pmtiles-jiko",
    "source-layer": "honhyo_20192024_convert",
    type: "circle",
    paint: { "circle-color": "#FF003F", "circle-radius": 6 },
  });
  map.addLayer({
    id: "shiboujiko-label",
    type: "symbol",
    source: "pmtiles-jiko",
    "source-layer": "honhyo_20192024_convert",
    minzoom: 16,
    maxzoom: 23,
    layout: {
      "text-field": [
        "concat",
        ["get", "発生日時_年"],
        "/",
        ["get", "発生日時_月"],
        "/",
        ["get", "発生日時_日"],
      ],
      "text-font": ["NotoSansJP-Regular"],
      "text-offset": [0, -1.2],
      "text-allow-overlap": true,
      "text-size": 12,
    },
    paint: {
      "text-color": "rgba(255, 0, 0, 1)",
      "text-halo-color": "rgba(255, 255, 255, 1)",
      "text-halo-width": 1,
    },
  });
  map.setFilter("shiboujiko-1", ["==", "事故内容", "死亡事故"]);
  map.setFilter("shiboujiko-2", ["==", "事故内容", "死亡事故"]);
  map.setFilter("shiboujiko-label", ["==", "事故内容", "死亡事故"]);

  // 小学校ソース
  map.addSource("pmtiles-school", {
    type: "vector",
    url: "pmtiles://https://xs489works.xsrv.jp/pmtiles-data/traffic-accident/P29-21_primary_school.pmtiles",
    attribution:
      '<a href="https://nlftp.mlit.go.jp/">国土数値情報 学校データを加工して作成</a>',
  });
  map.addLayer({
    id: "school-1",
    source: "pmtiles-school",
    "source-layer": "P2921_primary_school",
    type: "circle",
    minzoom: 13,
    maxzoom: 23,
    paint: { "circle-color": "#FFFFFF", "circle-radius": 8 },
  });
  map.addLayer({
    id: "school-2",
    source: "pmtiles-school",
    "source-layer": "P2921_primary_school",
    type: "circle",
    minzoom: 13,
    maxzoom: 23,
    paint: { "circle-color": "#009800", "circle-radius": 6 },
  });
  map.addLayer({
    id: "school-label",
    type: "symbol",
    source: "pmtiles-school",
    "source-layer": "P2921_primary_school",
    minzoom: 13,
    maxzoom: 23,
    layout: {
      "text-field": ["get", "P29_004"],
      "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-offset": [0, -1.2],
    },
    paint: {
      "text-color": "rgba(0, 152, 0, 1)",
      "text-halo-blur": 1,
      "text-halo-color": "rgba(255, 255, 255, 1)",
      "text-halo-width": 1.5,
    },
  });

  map.showTileBoundaries = false;
});

// ポップアップ HTML を生成するユーティリティ
function buildPopupHtml(
  props: Record<string, unknown>,
  lng: number,
  lat: number,
  accentColor: "red" | "blue"
): string {
  const jikonaiyo = props["事故内容"] as string;
  const shishasu = parseInt(props["死者数"] as string);
  const fushoshasu = parseInt(props["負傷者数"] as string);
  const hasseinichiji = `${props["発生日時_年"]}年${props["発生日時_月"]}月${props["発生日時_日"]}日${props["発生日時_時"]}時${props["発生日時_分"]}分`;

  const rows: [string, string, string][] = [
    ["年齢層", props["年齢（当事者A）"] as string, props["年齢（当事者B）"] as string],
    ["当事者種別", props["当事者種別（当事者A）"] as string, props["当事者種別（当事者B）"] as string],
    ["車両の衝突部位", props["車両の衝突部位（当事者A）"] as string, props["車両の衝突部位（当事者B）"] as string],
    ["車両の損壊程度", props["車両の損壊程度（当事者A）"] as string, props["車両の損壊程度（当事者B）"] as string],
    ["人身損傷程度", props["人身損傷程度（当事者A）"] as string, props["人身損傷程度（当事者B）"] as string],
    ["用途別", props["用途別（当事者A）"] as string, props["用途別（当事者B）"] as string],
    ["車両形状", props["車両形状（当事者A）"] as string, props["車両形状（当事者B）"] as string],
    ["速度規制（指定のみ）", props["速度規制（指定のみ）（当事者A）"] as string, props["速度規制（指定のみ）（当事者B）"] as string],
    ["一時停止規制_標識", props["一時停止規制_標識（当事者A）"] as string, props["一時停止規制_標識（当事者B）"] as string],
    ["一時停止規制_表示", props["一時停止規制_表示（当事者A）"] as string, props["一時停止規制_表示（当事者B）"] as string],
    ["エアバッグの装備", props["エアバッグの装備（当事者A）"] as string, props["エアバッグの装備（当事者B）"] as string],
    ["サイドエアバッグの装備", props["サイドエアバッグの装備（当事者A）"] as string, props["サイドエアバッグの装備（当事者B）"] as string],
  ];

  const tableRows = rows
    .map(([label, a, b]) => `<tr><td>${label}</td><td>${a}</td><td>${b}</td></tr>`)
    .join("");

  return `
    <b><big><font color="${accentColor}">事故内容: ${jikonaiyo}</font></big></b><br>
    発生日時: ${hasseinichiji}<br>
    路線名: ${props["路線名"]}<br>
    上下線: ${props["上下線"]}<br>
    死者数: ${shishasu}<br>
    負傷者数: ${fushoshasu}<br>
    天候: ${props["天候"]}<br>
    地形: ${props["地形"]}<br>
    路面状態: ${props["路面状態"]}<br>
    道路形状: ${props["道路形状"]}<br>
    信号機: ${props["信号機"]}<br>
    車道幅員: ${props["車道幅員"]}<br>
    道路線形: ${props["道路線形"]}<br>
    衝突地点: ${props["衝突地点"]}<br>
    ゾーン規制: ${props["ゾーン規制"]}<br>
    中央分離帯施設等: ${props["中央分離帯施設等"]}<br>
    歩車道区分: ${props["歩車道区分"]}<br>
    事故類型: ${props["事故類型"]}<br>
    <table style="font-size:9pt;border-collapse:collapse;">
      <tr><th width="140">項目</th><th width="100">当事者A</th><th width="100">当事者B</th></tr>
      ${tableRows}
    </table>
    座標: ${lat.toFixed(7)},${lng.toFixed(7)} ※事故発生位置の座標<br>
    <a href="https://www.google.com/maps?q=${lat},${lng}&hl=ja" target="_blank">🌎Google Maps</a>
    <a href="https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}&hl=ja" target="_blank">📷Street View</a>
  `;
}

// クリックイベント共通処理
function addPopupOnClick(layerId: string, accentColor: "red" | "blue"): void {
  map.on("click", layerId, (e: MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
    if (!e.features || e.features.length === 0) return;
    const feature = e.features[0];
    const coords = (feature.geometry as GeoJSON.Point).coordinates;
    const lng = coords[0];
    const lat = coords[1];
    const props = feature.properties as Record<string, unknown>;

    new maplibregl.Popup()
      .setLngLat(e.lngLat)
      .setHTML(buildPopupHtml(props, lng, lat, accentColor))
      .addTo(map);
  });

  map.on("mouseenter", layerId, () => {
    map.getCanvas().style.cursor = "pointer";
  });
  map.on("mouseleave", layerId, () => {
    map.getCanvas().style.cursor = "";
  });
}

addPopupOnClick("shiboujiko-1", "red");
addPopupOnClick("fushoujiko-1", "blue");
