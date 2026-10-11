import { useState, useEffect } from "react";
import HeaderLogo from "./HeaderLogo";
import RouteMapCard from "./RouteMapCard";
import CustomModal from "./CustomModal";
import {
  getCoordinates,
  fetchWeather,
  FALLBACK_WEATHER,
} from "../utils/weather";

// =========================================================================
// 【確認・検証用】ダミー天気データ
// ※ 提出時は通常データを使用しますが、テスト確認用に保持しています。
// ※ 使用する際は、下記のコメントアウトと JSX 内のテストパネルを解除してください。
// =========================================================================
/*
const TEST_WEATHER_DATA = {
  Clear: { main: "Clear", icon: "☀️", label: "晴れ", temp: 22, isFallback: false },
  Clouds: { main: "Clouds", icon: "☁️", label: "曇り", temp: 18, isFallback: false },
  Rain: { main: "Rain", icon: "☔", label: "雨", temp: 15, isFallback: false },
  Drizzle: { main: "Drizzle", icon: "🌧️", label: "小雨", temp: 16, isFallback: false },
  Thunderstorm: { main: "Thunderstorm", icon: "⚡", label: "雷雨", temp: 19, isFallback: false },
  Snow: { main: "Snow", icon: "❄️", label: "雪", temp: 1, isFallback: false },
  Mist: { main: "Mist", icon: "🌫️", label: "霧", temp: 12, isFallback: false },
  Fog: { main: "Fog", icon: "🌫", label: "濃霧", temp: 10, isFallback: false },
};
*/

export default function PlanDetail({
  plan,
  onBack,
  onDeletePlan,
  onUpdatePlan,
  onEditPlan,
}) {
  const [todos, setTodos] = useState(plan?.todos || []);
  const [prevPlanId, setPrevPlanId] = useState(plan?.id);

  const [todoInput, setTodoInput] = useState("");
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  // 天気情報の状態管理
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // アラートモーダル用ステート
  const [alertMessage, setAlertMessage] = useState("");

  // ★ テスト天気機能（テスト時はコメント解除）
  // const [testWeatherKey, setTestWeatherKey] = useState(null);
  // const displayWeather = testWeatherKey && typeof TEST_WEATHER_DATA !== "undefined" ? TEST_WEATHER_DATA[testWeatherKey] : weather;

  // 通常時の表示用天気データ
  const displayWeather = weather;

  // 削除モーダルの状態管理: "none" | "confirm" | "complete"
  const [deleteModalState, setDeleteModalState] = useState("none");

  // 場所名がオブジェクト（AutoComplete選択データ）か文字列か判定して安全に文字列を取り出す
  const rawLocation = plan?.location || plan?.destination;
  const targetLocation =
    typeof rawLocation === "object" && rawLocation !== null
      ? rawLocation.mainText ||
        rawLocation.description ||
        rawLocation.name ||
        ""
      : rawLocation || "";

  if (plan?.id !== prevPlanId) {
    setPrevPlanId(plan?.id);
    setTodos(plan?.todos || []);
  }

  // 天気情報の抽出に必要な値だけを個別に変数として定義
  const targetDate = plan?.dateRange?.startDate || plan?.date;

  // 天気データの取得処理
  useEffect(() => {
    async function loadWeather() {
      if (!targetLocation) {
        setWeather(FALLBACK_WEATHER);
        return;
      }

      setWeatherLoading(true);

      const coords = await getCoordinates(targetLocation);

      if (coords) {
        // 依存配列で監視している targetDate をそのまま使用
        const weatherData = await fetchWeather(
          coords.lat,
          coords.lon,
          targetDate,
        );
        setWeather(weatherData);
      } else {
        setWeather(FALLBACK_WEATHER);
      }

      setWeatherLoading(false);
    }

    loadWeather();
  }, [targetLocation, targetDate]);
  if (!plan && deleteModalState !== "complete") return null;

  // --- 日付表示テキストの取得 ---
  const getDateText = () => {
    if (plan?.dateRange?.startDate && plan?.dateRange?.endDate) {
      if (plan.dateRange.startDate === plan.dateRange.endDate) {
        return plan.dateRange.startDate;
      }
      return `${plan.dateRange.startDate} ～ ${plan.dateRange.endDate}`;
    }
    return plan?.date || "";
  };

  // --- Todoの削除 ---
  const handleDeleteTodo = (id) => {
    const nextTodos = todos.filter((t) => t.id !== id);
    setTodos(nextTodos);
    if (onUpdatePlan && plan) {
      onUpdatePlan({ ...plan, todos: nextTodos });
    }
  };

  // --- Todoの追加（30件上限チェック） ---
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!todoInput.trim()) return;

    // 30件上限チェック
    if (todos.length >= 30) {
      setAlertMessage(
        "登録できるのは30項目までです。詰め込み過ぎると楽しめませんよ？",
      );
      return;
    }

    const newTodo = { id: Date.now(), text: todoInput.trim() };
    const nextTodos = [...todos, newTodo];

    setTodos(nextTodos);
    setTodoInput("");
    setIsAddingTodo(false);

    if (onUpdatePlan && plan) {
      onUpdatePlan({ ...plan, todos: nextTodos });
    }
  };

  // --- 削除確認画面で「はい」を押した時 ---
  const handleConfirmDelete = () => {
    if (onDeletePlan && plan) {
      onDeletePlan(plan.id);
    }
    setDeleteModalState("complete");
  };

  // --- 削除完了画面で「OK」を押した時 ---
  const handleCompleteOk = () => {
    setDeleteModalState("none");
    onBack();
  };

  // --- 指摘7対応：Google Hotels連携 (場所および日程の反映) ---
  const handleSearchHotel = () => {
    const locationName = targetLocation || "東京";
    const searchParams = new URLSearchParams();

    // 検索キーワードの設定
    searchParams.append("q", locationName);

    // チェックイン・チェックアウト日付の解析
    const startDateStr = plan?.dateRange?.startDate || plan?.date;
    const endDateStr = plan?.dateRange?.endDate;

    if (startDateStr) {
      // YYYY-MM-DD 形式か確認・パース
      const startDate = new Date(startDateStr);
      if (!isNaN(startDate.getTime())) {
        const startDateFormatted = startDate.toISOString().split("T")[0];
        searchParams.append("checkin", startDateFormatted);

        if (endDateStr) {
          const endDate = new Date(endDateStr);
          if (!isNaN(endDate.getTime())) {
            searchParams.append(
              "checkout",
              endDate.toISOString().split("T")[0],
            );
          }
        } else {
          // 終了日未指定時は翌日をデフォルトのチェックアウト日に設定（1泊2日）
          const nextDay = new Date(startDate);
          nextDay.setDate(nextDay.getDate() + 1);
          searchParams.append("checkout", nextDay.toISOString().split("T")[0]);
        }
      }
    }

    const searchUrl = `https://www.google.com/travel/hotels?${searchParams.toString()}`;
    window.open(searchUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-md bg-app-bg text-app-main p-6 space-y-6 mx-auto relative">
      {/* 1. タイトル & 日程変更ボタン */}
      <HeaderLogo small={true} />

      <div className="relative flex items-center justify-center pt-2">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800 tracking-wide">
            {plan?.title || "旅の計画"}
          </h2>
          {getDateText() && (
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              {getDateText()}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onEditPlan && plan && onEditPlan(plan)}
          className="absolute right-0 top-0 py-1.5 px-3 bg-[#d0f0ec] text-slate-700 font-bold text-xs rounded-full shadow-sm hover:opacity-80"
        >
          日程変更
        </button>
      </div>

      {/* 2. マップエリア */}
      <RouteMapCard destination={plan?.location || plan?.destination} />

      {/* 3. やりたいこと エリア */}
      <div className="space-y-2">
        <h3 className="text-center font-bold text-slate-700 text-lg">
          やりたいこと
        </h3>

        <div className="bg-white rounded-3xl p-5 shadow-sm space-y-3 min-h-[100px] flex flex-col justify-center">
          {todos.length > 0 ? (
            <ul className="space-y-2.5">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center justify-between text-slate-700 text-sm font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <span>・</span>
                    <span>{todo.text}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="py-1 px-3 bg-[#d0f0ec] text-slate-700 text-xs font-bold rounded-full hover:opacity-80 shadow-sm"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div>
              {!isAddingTodo ? (
                <div className="flex items-center justify-between px-2">
                  <span className="text-slate-300 font-bold text-sm tracking-wide">
                    やりたいこと、ないですか？
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddingTodo(true)}
                    className="py-1 px-3 bg-[#d0f0ec] text-slate-700 text-xs font-bold rounded-full hover:opacity-80 shadow-sm"
                  >
                    追加
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddTodo} className="flex gap-2">
                  <input
                    type="text"
                    value={todoInput}
                    onChange={(e) => setTodoInput(e.target.value)}
                    placeholder="例：浅草寺に行く"
                    className="flex-1 py-1.5 px-3 rounded-full bg-slate-50 text-slate-800 text-xs border border-slate-200 focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="py-1.5 px-3 bg-[#d0f0ec] text-slate-700 text-xs font-bold rounded-full"
                  >
                    登録
                  </button>
                </form>
              )}
            </div>
          )}

          {todos.length > 0 && !isAddingTodo && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddingTodo(true)}
                className="py-1 px-3 bg-[#d0f0ec] text-slate-700 text-xs font-bold rounded-full hover:opacity-80 shadow-sm"
              >
                + 追加
              </button>
            </div>
          )}

          {todos.length > 0 && isAddingTodo && (
            <form onSubmit={handleAddTodo} className="flex gap-2 pt-2">
              <input
                type="text"
                value={todoInput}
                onChange={(e) => setTodoInput(e.target.value)}
                placeholder="例：浅草寺に行く"
                className="flex-1 py-1.5 px-3 rounded-full bg-slate-50 text-slate-800 text-xs border border-slate-200 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="py-1.5 px-3 bg-[#d0f0ec] text-slate-700 text-xs font-bold rounded-full"
              >
                登録
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 4. 天気エリア */}
      <div className="space-y-2">
        <h3 className="text-center font-bold text-slate-700 text-sm">
          {getDateText() ? `${getDateText()} の` : ""}
          {targetLocation || "目的地"} の天気
        </h3>

        <div
          className={`weather-card-container ${
            displayWeather?.main
              ? `weather-bg-${displayWeather.main}`
              : "bg-white"
          } rounded-3xl p-5 shadow-sm text-center flex items-center justify-center min-h-[90px] relative overflow-hidden`}
        >
          {displayWeather?.main && (
            <div className={`weather-overlay ${displayWeather.main}`} />
          )}

          <div className="relative z-10 w-full flex items-center justify-center">
            {weatherLoading ? (
              <p className="text-xs text-slate-400 font-bold animate-pulse">
                天気を読み込み中...
              </p>
            ) : displayWeather ? (
              displayWeather.isFallback ? (
                <div className="text-center space-y-1">
                  <p className="text-2xl">🗓️</p>
                  <p className="text-xs font-bold text-slate-500">
                    天気情報は準備中（または範囲外）です
                  </p>
                  <p className="text-[10px] text-slate-400">
                    ※日程が遠い場合は直前にご確認ください
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <span className="text-4xl">{displayWeather.icon}</span>
                  <div className="text-left">
                    <p className="text-base font-bold text-slate-700">
                      {displayWeather.label}
                    </p>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      {displayWeather.temp !== "--"
                        ? `${displayWeather.temp}℃`
                        : "気温データなし"}
                    </p>
                  </div>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>

      {/* 5. アクションボタン群 */}
      <div className="pt-2 space-y-4">
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSearchHotel}
            className="py-3 px-8 bg-[#d0f0ec] text-slate-700 font-bold text-sm rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all"
          >
            宿泊先を探す
          </button>
        </div>

        <div className="flex justify-between items-center px-2">
          <button
            type="button"
            onClick={onBack}
            className="py-1.5 px-4 bg-[#d0f0ec] text-slate-700 font-bold text-xs rounded-full hover:opacity-80 shadow-sm"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalState("confirm")}
            className="py-1.5 px-4 bg-[#d0f0ec] text-slate-700 font-bold text-xs rounded-full hover:opacity-80 shadow-sm"
          >
            削除
          </button>
        </div>
      </div>

      {/* 6. 警告・アラート用統一モーダル */}
      <CustomModal
        isOpen={Boolean(alertMessage)}
        message={alertMessage}
        type="alert"
        okText="OK"
        onClose={() => setAlertMessage("")}
      />

      {/* 7. 削除モーダル群 */}
      {deleteModalState === "confirm" && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-6">
          <div className="bg-[#E0F8F6] rounded-3xl p-8 w-full max-w-xs shadow-xl text-center space-y-3 border border-white">
            <h3 className="text-base font-bold text-[#1e5a62] tracking-wide">
              {plan?.title || "タイトル"}
            </h3>
            {getDateText() && (
              <p className="text-xs font-bold text-[#1e5a62]/80">
                {getDateText()}
              </p>
            )}
            <p className="text-sm font-bold text-[#1e5a62] pt-1">
              この旅程を削除しますか？
            </p>

            <div className="flex justify-center gap-4 pt-3">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-1.5 px-6 bg-[#D4F4F0] text-[#1e5a62] text-xs font-bold rounded-full shadow border border-white hover:bg-white active:scale-95 transition-all"
              >
                はい
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalState("none")}
                className="py-1.5 px-6 bg-[#D4F4F0] text-[#1e5a62] text-xs font-bold rounded-full shadow border border-white hover:bg-white active:scale-95 transition-all"
              >
                いいえ
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalState === "complete" && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-50 p-6">
          <div className="bg-[#E0F8F6] rounded-3xl p-8 w-full max-w-xs shadow-xl text-center space-y-4 border border-white">
            <p className="text-sm font-bold text-[#1e5a62] pt-2">
              削除が完了しました
            </p>

            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleCompleteOk}
                className="py-1.5 px-8 bg-[#D4F4F0] text-[#1e5a62] text-xs font-bold rounded-full shadow border border-white hover:bg-white active:scale-95 transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
