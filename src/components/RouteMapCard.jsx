import { useEffect, useRef, useState } from "react";
import { loadGoogleMapsLibrary } from "../utils/googleMapsLoader";

export default function RouteMapCard({ destination }) {
  const mapRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedMode, setSelectedMode] = useState("DRIVING");
  const [currentOrigin, setCurrentOrigin] = useState(null);

  const mapInstanceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    // 現在地取得
    const getCurrentLocation = () => {
      return new Promise((resolve) => {
        const defaultLocation = { lat: 35.681236, lng: 139.767125 };

        if (!navigator.geolocation) {
          resolve(defaultLocation);
          return;
        }

        let hasResolved = false;

        const timer = setTimeout(() => {
          if (!hasResolved) {
            hasResolved = true;
            resolve(defaultLocation);
          }
        }, 5000);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            if (!hasResolved) {
              hasResolved = true;
              clearTimeout(timer);
              const loc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              if (isMounted) setCurrentOrigin(loc);
              resolve(loc);
            }
          },
          () => {
            if (!hasResolved) {
              hasResolved = true;
              clearTimeout(timer);
              if (isMounted) setCurrentOrigin(defaultLocation);
              resolve(defaultLocation);
            }
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      });
    };

    const initMapAndRoute = async () => {
      if (!destination) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        if (isMounted) {
          setLoading(true);
          setErrorMessage("");
        }

        // SDK 標準の routes ライブラリを読み込み
        const [{ Map }, { DirectionsService, DirectionsRenderer, TravelMode }] =
          await Promise.all([
            loadGoogleMapsLibrary("maps"),
            loadGoogleMapsLibrary("routes"),
          ]);

        const originLatLng = await getCurrentLocation();

        if (!isMounted || !mapRef.current) return;

        // マップの初期化
        if (!mapInstanceRef.current) {
          mapInstanceRef.current = new Map(mapRef.current, {
            center: originLatLng,
            zoom: 13,
            disableDefaultUI: true,
            zoomControl: true,
          });
        }
        const map = mapInstanceRef.current;

        // DirectionsRenderer の初期化
        if (!directionsRendererRef.current) {
          directionsRendererRef.current = new DirectionsRenderer({
            map: map,
            suppressMarkers: false,
          });
        } else {
          directionsRendererRef.current.setMap(map);
        }

        // 目的地の形式を安全に判別
        let destinationParam = null;

        if (typeof destination === "string") {
          destinationParam = destination.trim();
        } else if (typeof destination === "object" && destination !== null) {
          const lat = Number(destination.lat ?? destination.latitude);
          const lng = Number(destination.lng ?? destination.longitude);

          if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
            destinationParam = { lat, lng };
          } else {
            const text =
              destination.mainText ||
              destination.description ||
              destination.name ||
              destination.address;

            if (text) {
              destinationParam = String(text).trim();
            } else if (destination.placeId) {
              destinationParam = { placeId: destination.placeId };
            }
          }
        }

        if (!destinationParam) {
          throw new Error("有効な目的地が判定できませんでした。");
        }

        // 移動モードのマッピング
        const modeMap = {
          DRIVING: TravelMode.DRIVING,
          WALKING: TravelMode.WALKING,
          BICYCLE: TravelMode.BICYCLE,
        };

        const directionsService = new DirectionsService();

        // 検索リクエストの送信
        directionsService.route(
          {
            origin: originLatLng,
            destination: destinationParam,
            travelMode: modeMap[selectedMode] || TravelMode.DRIVING,
          },
          (result, status) => {
            if (!isMounted) return;

            if (status === "OK" && result) {
              directionsRendererRef.current.setDirections(result);
            } else {
              setErrorMessage(
                `ルートが見つかりませんでした (ステータス: ${status})`,
              );
            }
            setLoading(false);
          },
        );
      } catch {
        if (isMounted) {
          setErrorMessage("マップ処理中にエラーが発生しました。");
          setLoading(false);
        }
      }
    };

    initMapAndRoute();

    return () => {
      isMounted = false;
    };
  }, [destination, selectedMode]);

  const getExternalMapsUrl = () => {
    let destParam;
    let placeIdParam = "";

    if (typeof destination === "object" && destination !== null) {
      const name =
        destination.mainText ||
        destination.description ||
        destination.name ||
        "";
      destParam = encodeURIComponent(name);
      if (destination.placeId) {
        placeIdParam = `&destination_place_id=${destination.placeId}`;
      }
    } else {
      destParam = encodeURIComponent(destination || "");
    }

    if (currentOrigin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${currentOrigin.lat},${currentOrigin.lng}&destination=${destParam}${placeIdParam}&travelmode=transit`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${destParam}${placeIdParam}&travelmode=transit`;
  };

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-700 text-xs flex items-center gap-1">
          📍 ルート案内
        </h3>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-full text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setSelectedMode("DRIVING")}
            className={`px-2.5 py-1 rounded-full transition-all ${
              selectedMode === "DRIVING"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            🚗 車
          </button>
          <button
            type="button"
            onClick={() => setSelectedMode("WALKING")}
            className={`px-2.5 py-1 rounded-full transition-all ${
              selectedMode === "WALKING"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            🚶 徒歩
          </button>
          <button
            type="button"
            onClick={() => setSelectedMode("BICYCLE")}
            className={`px-2.5 py-1 rounded-full transition-all ${
              selectedMode === "BICYCLE"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            🚲 自転車
          </button>
        </div>
      </div>

      <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-slate-100">
        <div ref={mapRef} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-500 font-bold text-xs gap-2 z-10">
            <div className="w-4 h-4 border-2 border-[#1e5a62] border-t-transparent rounded-full animate-spin" />
            最適ルートを検索中...
          </div>
        )}

        {errorMessage && (
          <div className="absolute bottom-3 left-3 right-3 bg-rose-50/90 backdrop-blur-sm text-rose-600 p-2 rounded-xl text-xs font-bold text-center shadow-sm z-10">
            ⚠️ {errorMessage}
          </div>
        )}
      </div>

      <div className="text-center pt-0.5">
        <a
          href={getExternalMapsUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#d0f0ec] text-[#1e5a62] text-xs font-bold rounded-full shadow-sm hover:opacity-80 transition-all w-full"
        >
          <span>🚃 Googleマップアプリで公共交通機関を使ったルートを見る</span>
          <span className="text-sm">↗</span>
        </a>
      </div>
    </div>
  );
}
