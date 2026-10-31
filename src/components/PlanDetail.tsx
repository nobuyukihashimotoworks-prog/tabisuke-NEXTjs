"use client";

import { useState, useEffect } from "react";
import { Plan, Todo } from "@/types/plan";
import HeaderLogo from "./HeaderLogo";
import RouteMapCard from "./RouteMapCard";
import TodoList from "./TodoList";
import CustomModal from "./CustomModal";
import {
  getCoordinates,
  fetchWeather,
  FALLBACK_WEATHER,
} from "../utils/weather";
import { supabase } from "@/utils/supabase";

interface PlanDetailProps {
  plan?: Plan | null;
  onBack: () => void;
  onDeletePlan?: (planId: string | number) => void;
  onUpdatePlan?: (updatedPlan: Plan) => void;
  onEditPlan?: (plan: Plan) => void;
}

export default function PlanDetail({
  plan,
  onBack,
  onDeletePlan,
  onUpdatePlan,
  onEditPlan,
}: PlanDetailProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [todos, setTodos] = useState<any[]>(plan?.todos || []);
  const [prevPlanId, setPrevPlanId] = useState<string | number | undefined>(
    plan?.id,
  );

  const [todoInput, setTodoInput] = useState("");
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  // 天気情報の状態管理
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [weather, setWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // アラートモーダル用ステート
  const [alertMessage, setAlertMessage] = useState("");

  // 通常時の表示用天気データ
  const displayWeather = weather;

  // 削除モーダルの状態管理: "none" | "confirm" | "complete"
  const [deleteModalState, setDeleteModalState] = useState<
    "none" | "confirm" | "complete"
  >("none");

  // 場所名がオブジェクトか文字列か判定して安全に文字列を取り出す
  const rawLocation = plan?.location;
  const targetLocation =
    typeof rawLocation === "object" && rawLocation !== null
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (rawLocation as any).mainText ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (rawLocation as any).description ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (rawLocation as any).name ||
        ""
      : typeof rawLocation === "string"
        ? rawLocation
        : "";

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
  // --- SupabaseへTodo配列を保存する共通関数 ---
  const updateTodosInSupabase = async (newTodos: Todo[]) => {
    if (!plan) return;

    try {
      const { error } = await supabase
        .from("itineraries")
        .update({ todos: newTodos })
        .eq("id", plan.id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Todoの保存エラー:", error);
      setAlertMessage("データベースへの保存に失敗しました。");
    }
  };
  // --- Todoの削除 ---
  const handleDeleteTodo = async (id: number | string) => {
    const nextTodos = todos.filter((t) => t.id !== id);
    setTodos(nextTodos);
    if (onUpdatePlan && plan) {
      onUpdatePlan({ ...plan, todos: nextTodos });
    }
    // Supabaseへ反映
    await updateTodosInSupabase(nextTodos);
  };

  // --- Todoの追加（30件上限チェック） ---
  const handleAddTodo = async (e: React.FormEvent) => {
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
    // Supabaseへ反映
    await updateTodosInSupabase(nextTodos);
  };

  // --- 削除完了画面で「OK」を押した時 ---
  const handleCompleteOk = () => {
    setDeleteModalState("none");
    onBack();
  };
  // --- 削除確認画面で「はい」を押した時 ---
  const handleConfirmDelete = async () => {
    if (!plan) return;

    try {
      // 1. Supabaseのitinerariesテーブルからレコードを削除
      const { error } = await supabase
        .from("itineraries")
        .delete()
        .eq("id", plan.id);

      if (error) {
        throw error;
      }

      // 2. アプリ側の状態（親コンポーネント）を更新
      if (onDeletePlan) {
        onDeletePlan(plan.id);
      }

      setDeleteModalState("complete");
    } catch (error) {
      console.error("削除エラー:", error);
      setAlertMessage("データベースからの削除に失敗しました。");
    }
  };

  // --- Google Hotels 目的地のみ連携 ---
  const handleSearchHotel = () => {
    const locationName = targetLocation || "東京";
    const searchParams = new URLSearchParams();

    searchParams.append("q", locationName);

    const searchUrl = `https://www.google.com/travel/search?${searchParams.toString()}`;
    window.open(searchUrl, "_blank", "noopener,noreferrer");
  };

  return (
    // Home画面や登録画面と完全に共通のコンテナ幅（max-w-xl）と中央揃え（mx-auto）を適用
    <div className="w-full max-w-xl min-h-screen bg-app-bg text-app-main p-6 space-y-6 mx-auto relative flex flex-col items-center">
      {/* 1. ヘッダーロゴ（大きなサイズに変更） */}
      <HeaderLogo />

      {/* 2. 日程変更ボタン（上部・右寄せ） & タイトルエリア（ロゴとのすき間をすっきり調整） */}
      <div className="space-y-1 w-full pt-1">
        <div className="flex justify-end px-2">
          <button
            type="button"
            onClick={() => onEditPlan && plan && onEditPlan(plan)}
            className="py-1.5 px-3 bg-[#d0f0ec] text-slate-700 font-bold text-xs rounded-full shadow-sm hover:opacity-80"
          >
            日程変更
          </button>
        </div>

        <div className="text-center px-4 space-y-0.5">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-wide break-all leading-snug">
            {plan?.title || "旅の計画"}
          </h2>
          {getDateText() && (
            <p className="text-xs md:text-sm font-bold text-slate-500 mt-0.5">
              {getDateText()}
            </p>
          )}
        </div>
      </div>

      {/* 3. マップエリア（正方形サイズに合わせるためw-full flex justify-center） */}
      <div className="w-full flex justify-center">
        <RouteMapCard destination={plan?.location} />
      </div>

      {/* 4. やりたいこと エリア */}
      <div className="space-y-2 w-full">
        <h3 className="text-center font-bold text-slate-700 text-lg md:text-xl">
          やりたいこと
        </h3>

        <TodoList
          todos={todos}
          onDeleteTodo={handleDeleteTodo}
          onAddClick={() => setIsAddingTodo(true)}
        />

        {/* 追加用のフォーム部分（入力欄が開いているときだけ表示） */}
        {isAddingTodo && (
          <form onSubmit={handleAddTodo} className="flex gap-2 pt-2">
            <input
              type="text"
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              placeholder="例：浅草寺に行く"
              className="flex-1 py-2.5 px-4 rounded-full bg-slate-50 text-slate-800 text-sm border border-slate-200 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="py-2.5 px-5 bg-[#d0f0ec] text-slate-700 text-sm font-bold rounded-full"
            >
              登録
            </button>
          </form>
        )}
      </div>

      {/* 5. 天気エリア */}
      <div className="space-y-2 w-full">
        <h3 className="text-center font-bold text-slate-700 text-sm md:text-base">
          {getDateText() ? `${getDateText()} の` : ""}
          {targetLocation || "目的地"} の天気
        </h3>

        <div
          className={`weather-card-container ${
            displayWeather?.main
              ? `weather-bg-${displayWeather.main}`
              : "bg-white"
          } rounded-3xl p-5 shadow-sm text-center flex items-center justify-center min-h-[90px] relative overflow-hidden w-full`}
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
              displayWeather.isOutOfRange ? (
                <div className="text-center space-y-1">
                  <p className="text-2xl">📅</p>
                  <p className="text-xs font-bold text-slate-500">
                    予報期間外（5日以内のみ表示）です
                  </p>
                  <p className="text-[10px] text-slate-400">
                    ※直前になると天気予報が表示されます
                  </p>
                </div>
              ) : displayWeather.isFallback ? (
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

      {/* 6. アクションボタン群 */}
      <div className="pt-2 space-y-3 w-full">
        <div className="flex flex-col items-center gap-1.5 w-full">
          <button
            type="button"
            onClick={handleSearchHotel}
            className="w-full py-3 bg-[#d0f0ec] text-slate-700 font-bold text-base rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all text-center"
          >
            目的地周辺の宿泊先を探す
          </button>

          {/* 対象の旅程（日付）の表示 */}
          {getDateText() && (
            <p className="text-xs md:text-sm font-bold text-slate-500 mt-1">
              今回の旅程：{getDateText()}
            </p>
          )}

          <p className="text-[11px] md:text-xs font-bold text-slate-500 text-center mt-1">
            ※引き継げるのは目的地だけです！
            <br />
            旅行の日程は引き継げないのでGoogle Travel上で設定してね🙇‍♂️
          </p>
        </div>

        {/* 戻る（左寄せ）＆ 削除（右寄せ） */}
        <div className="flex justify-between items-center px-2 pt-2 w-full">
          <button
            type="button"
            onClick={onBack}
            className="py-2 px-6 bg-slate-200 text-slate-600 font-bold text-sm rounded-full hover:bg-slate-300 transition shadow-sm"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={() => setDeleteModalState("confirm")}
            className="py-2 px-6 bg-rose-100 text-rose-600 font-bold text-sm rounded-full hover:bg-rose-200 transition shadow-sm"
          >
            削除
          </button>
        </div>
      </div>

      {/* 7. 警告・アラート用統一モーダル */}
      <CustomModal
        isOpen={Boolean(alertMessage)}
        message={alertMessage}
        type="alert"
        okText="OK"
        onClose={() => setAlertMessage("")}
      />

      {/* 8. 削除モーダル群 */}
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
