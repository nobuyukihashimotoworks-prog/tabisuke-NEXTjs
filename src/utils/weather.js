const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

// API エラー時や通信失敗時のフォールバックデータ
export const FALLBACK_WEATHER = {
  label: "天気情報なし",
  icon: "❓",
  temp: "--",
  maxTemp: "--",
  minTemp: "--",
  isFallback: true,
};

// 予報期間外（5日より先、または過去）の場合の表示用データ
export const OUT_OF_RANGE_WEATHER = {
  label: "予報期間外",
  icon: "📅",
  temp: "--",
  maxTemp: "--",
  minTemp: "--",
  isFallback: true,
  isOutOfRange: true,
};

// OpenWeatherMapの天気メインコードを日本語・絵文字に変換するマップ
const WEATHER_MAP = {
  Clear: { label: "晴れ", icon: "☀️" },
  Clouds: { label: "曇り", icon: "☁️" },
  Rain: { label: "雨", icon: "☔" },
  Drizzle: { label: "小雨", icon: "🌧️" },
  Thunderstorm: { label: "雷雨", icon: "⚡" },
  Snow: { label: "雪", icon: "❄️" },
  Mist: { label: "霧", icon: "🌫️" },
  Fog: { label: "濃霧", icon: "🌫️" },
};

/**
 * 日本の住所・地名から「日本、」等の不要部分を削除して検索候補を作成
 */
function generateQueryCandidates(rawLocation) {
  if (!rawLocation) return [];

  let cleaned = rawLocation.trim().replace(/^日本[、, \t]*/, "");
  const candidates = [];

  candidates.push(cleaned);

  const parts = cleaned.split(/[ ,、]/).filter(Boolean);
  if (parts.length > 1) {
    candidates.push(parts[parts.length - 1]);
    candidates.push(parts[0]);
  }

  const cityMatch = cleaned.match(/(.+?[都道府県]?.+?[市区町村])/);
  if (cityMatch && cityMatch[1] && !candidates.includes(cityMatch[1])) {
    candidates.push(cityMatch[1]);
  }

  return candidates;
}

/**
 * 1. 地名から 緯度・経度 を取得する (OpenStreetMap / Nominatim API を使用)
 */
export async function getCoordinates(locationName) {
  if (!locationName) return null;

  const queries = generateQueryCandidates(locationName);

  for (const query of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query,
      )}&limit=1&accept-language=ja`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "TravelPlannerApp/1.0",
        },
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data && data.length > 0) {
        console.log(`【座標取得成功】「${query}」で座標を取得しました:`, {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        });
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
        };
      }
    } catch (error) {
      console.error(`ジオコーディング取得エラー (${query}):`, error);
    }
  }

  console.warn(
    `⚠️ 「${locationName}」の全検索候補で座標が見つかりませんでした`,
  );
  return null;
}

/**
 * 2. 緯度・経度と「予定日」から該当日の天気予報を取得する (OpenWeatherMap Forecast API)
 * @param {number} lat - 緯度
 * @param {number} lon - 経度
 * @param {string} targetDate - 予定日 (例: "2026-10-10" や "2026-10-10T00:00:00")
 */
export async function fetchWeather(lat, lon, targetDate = null) {
  if (!lat || !lon || !API_KEY) {
    console.warn("⚠️ APIキーまたは座標がないためフォールバック表示にします");
    return FALLBACK_WEATHER;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=ja&appid=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(
        "OpenWeatherMap API エラー。フォールバック表示を使用します。",
      );
      return FALLBACK_WEATHER;
    }

    const data = await response.json();
    if (!data || !data.list || data.list.length === 0) {
      return FALLBACK_WEATHER;
    }

    // 予定日が指定されていない場合は直近のデータを返す（安全対策）
    if (!targetDate) {
      const currentWeather = data.list[0];
      const mainCondition = currentWeather.weather[0]?.main;
      const conditionInfo = WEATHER_MAP[mainCondition] || {
        label: currentWeather.weather[0]?.description || "不明",
        icon: "🌤️",
      };
      return {
        label: conditionInfo.label,
        icon: conditionInfo.icon,
        main: mainCondition || "Clouds",
        conditionKey: mainCondition || "Clouds",
        temp: Math.round(currentWeather.main.temp),
        maxTemp: Math.round(currentWeather.main.temp_max),
        minTemp: Math.round(currentWeather.main.temp_min),
        isFallback: false,
      };
    }

    // ターゲット日付を YYYY-MM-DD 形式に正規化
    const formattedTargetDate = String(targetDate).split("T")[0];

    // 【修正箇所】-------------------------------------------------------------
    // APIが返す dt (UNIXタイムスタンプ) を日本時間 (Asia/Tokyo) の YYYY-MM-DD に変換して比較します。
    // (従来の dt_txt 文字列比較だと UTC と JST の9時間差により日付ズレが発生するため)
    const matchingForecasts = data.list.filter((item) => {
      const itemDateJST = new Date(item.dt * 1000).toLocaleDateString("sv-SE", {
        timeZone: "Asia/Tokyo",
      }); // "sv-SE" ロケールを使うことで "YYYY-MM-DD" 形式で取得できます
      return itemDateJST === formattedTargetDate;
    });
    // -------------------------------------------------------------------------

    // 該当する日付の予報がリスト内にない場合（5日以上の未来、または過去）
    if (matchingForecasts.length === 0) {
      console.warn(
        `⚠️ 予定日 (${formattedTargetDate}) は予報期間外（5日以内）です`,
      );
      return OUT_OF_RANGE_WEATHER;
    }

    // 【修正箇所】-------------------------------------------------------------
    // 昼12:00頃（JST時間）の予報を優先抽出します。
    // 見つからなければその日の最初の予報を採用します。
    const targetForecast =
      matchingForecasts.find((item) => {
        const itemHourJST = new Date(item.dt * 1000).toLocaleTimeString(
          "ja-JP",
          {
            timeZone: "Asia/Tokyo",
            hour: "2-digit",
            hour12: false,
          },
        );
        return itemHourJST === "12";
      }) || matchingForecasts[0];
    // -------------------------------------------------------------------------

    const mainCondition = targetForecast.weather[0]?.main;
    const conditionInfo = WEATHER_MAP[mainCondition] || {
      label: targetForecast.weather[0]?.description || "不明",
      icon: "🌤️",
    };

    return {
      label: conditionInfo.label,
      icon: conditionInfo.icon,
      main: mainCondition || "Clouds",
      conditionKey: mainCondition || "Clouds",
      temp: Math.round(targetForecast.main.temp),
      maxTemp: Math.round(targetForecast.main.temp_max),
      minTemp: Math.round(targetForecast.main.temp_min),
      isFallback: false,
    };
  } catch (error) {
    console.error("天気取得処理エラー:", error);
    return FALLBACK_WEATHER;
  }
}
