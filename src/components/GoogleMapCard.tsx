"use client";

interface LocationObj {
  lat?: number;
  latitude?: number;
  lng?: number;
  longitude?: number;
  mainText?: string;
  name?: string;
  description?: string;
}

interface GoogleMapCardProps {
  location: string | LocationObj | null | undefined;
}

export default function GoogleMapCard({ location }: GoogleMapCardProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  let targetQuery = "";
  let displayLabel = "";

  if (typeof location === "string" && location.trim() !== "") {
    // 1. 文字列で地名が渡された場合（例: "博多駅"）
    targetQuery = location.trim();
    displayLabel = location.trim();
  } else if (location && typeof location === "object") {
    // 2. 座標オブジェクト { lat, lng } または Places API オブジェクトの場合
    const lat = location.lat ?? location.latitude;
    const lng = location.lng ?? location.longitude;

    if (lat && lng) {
      targetQuery = `${lat},${lng}`;
      displayLabel = "現在地";
    } else {
      // mainText や description などのテキスト抽出
      targetQuery =
        location.mainText || location.name || location.description || "";
      displayLabel = location.mainText || location.name || "検索地点";
    }
  }

  // 3. 初期状態（searchLocation が null の場合）のピン立てデフォルト位置設定
  const finalQuery = targetQuery.trim() !== "" ? targetQuery : "東京駅";

  // Google Maps Embed API（place モードは q に渡した特定の場所・座標に確実にピンを立てます）
  const mapSrc = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(
    finalQuery,
  )}`;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-4 shadow-lg border border-white/60 space-y-3 aspect-square flex flex-col">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
          <span>🗺️</span>{" "}
          {displayLabel ? "目的地マップ" : "おすすめ・現在地エリア"}
        </h3>
        {displayLabel && (
          <span className="text-xs bg-app-accent/20 text-app-main px-2.5 py-0.5 rounded-full font-bold truncate max-w-[150px]">
            {displayLabel}
          </span>
        )}
      </div>

      {/* 地図埋め込みエリア */}
      <div className="w-full flex-1 rounded-2xl overflow-hidden shadow-inner bg-slate-100 border border-slate-200">
        <iframe
          title="Google Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          allow="geolocation"
          src={mapSrc}
        />
      </div>
    </div>
  );
}