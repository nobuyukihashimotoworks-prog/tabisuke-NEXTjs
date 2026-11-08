"use client";

import { useState, useEffect } from "react";
import { Plan } from "@/types/plan";
import HeaderLogo from "./HeaderLogo";
import CalendarCard from "./CalendarCard";
import RouteMapCard from "./RouteMapCard";
import TodoList from "./TodoList";
import CustomModal from "./CustomModal";
import { supabase } from "@/utils/supabase";

// ==========================================
// 【定数定義】4項目すべてをまとめて保存するためのストレージキー
// ==========================================
const TEMP_PLAN_REGISTER_KEY = "tabisuke_temp_plan_register_data";

// Todo項目の型定義
interface TodoItem {
  id: number;
  text: string;
}

// 期間（日付範囲）の型定義
interface DateRangeType {
  startDate: string | null;
  endDate: string | null;
}

interface PlanRegisterProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  location: any;
  onBack: () => void;
  onSavePlan: (newPlan: Plan) => void;
  plans?: Plan[];
}

export default function PlanRegister({
  location,
  onBack,
  onSavePlan,
  plans = [],
}: PlanRegisterProps) {
  const [todoInput, setTodoInput] = useState("");
  const [todoList, setTodoList] = useState<TodoItem[]>([]);
  const [planTitle, setPlanTitle] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeType>({
    startDate: null,
    endDate: null,
  });

  // モーダル用の表示ステート
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // 目的地名の安全な取得
  const locationName =
    typeof location === "object" && location !== null
      ? location.mainText || location.name || location.description || "目的地"
      : location || "目的地";

  // ==========================================
  // 【一括保存ヘルパー】現在の全入力をローカルストレージへ保存
  // ==========================================
  const saveAllToStorage = (
    currentTitle: string,
    currentDateRange: DateRangeType,
    currentTodoList: TodoItem[],
    currentLocation: any,
  ) => {
    if (typeof window !== "undefined") {
      const payload = {
        planTitle: currentTitle,
        dateRange: currentDateRange,
        todoList: currentTodoList,
        location: currentLocation,
      };
      localStorage.setItem(TEMP_PLAN_REGISTER_KEY, JSON.stringify(payload));
    }
  };

  // 一時保存データのクリーンアップ用
  const clearTempStorage = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TEMP_PLAN_REGISTER_KEY);
    }
  };

  // ==========================================
  // 【マウント時の一括復元処理】
  // ==========================================
  useEffect(() => {
    const saved = localStorage.getItem(TEMP_PLAN_REGISTER_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.planTitle) setPlanTitle(parsed.planTitle);
        if (parsed.dateRange) setDateRange(parsed.dateRange);
        if (parsed.todoList) setTodoList(parsed.todoList);
      } catch (e) {
        console.error("一時保存データの復元に失敗しました", e);
      }
    }
  }, []);

  // 表示用・保存用の共通日付フォーマット
  const formattedDateText = dateRange.endDate
    ? `${dateRange.startDate} 〜 ${dateRange.endDate}`
    : dateRange.startDate || "";

  // 30文字を超えているかどうかの判定フラグ
  const isTitleTooLong = planTitle.length > 30;

  // 指定された日付（YYYY-MM-DD）が既存の旅程と重複しているかチェック
  const isDateBooked = (dateStr: string) => {
    return plans.some((plan) => {
      const start = plan.dateRange?.startDate;
      if (!start) return false;
      const end = plan.dateRange?.endDate || start;
      return dateStr >= start && dateStr <= end;
    });
  };

  // タイトル変更時の即時セーブ連動
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setPlanTitle(newTitle);
    saveAllToStorage(newTitle, dateRange, todoList, location);
  };

  // カレンダーの日付選択
  const handleDateSelect = (selectedDateStr: string) => {
    if (isDateBooked(selectedDateStr)) {
      setAlertMessage("ダブルブッキングはできません！！");
      return;
    }

    if (dateRange.startDate && !dateRange.endDate) {
      if (selectedDateStr >= dateRange.startDate) {
        const hasOverlap = plans.some((plan) => {
          const start = plan.dateRange?.startDate;
          if (!start) return false;
          const end = plan.dateRange?.endDate || start;
          return !(
            selectedDateStr < start ||
            (dateRange.startDate && dateRange.startDate > end)
          );
        });

        if (hasOverlap) {
          setAlertMessage(
            "選択した期間内に既存の予定が含まれているため、ダブルブッキングはできません！！",
          );
          return;
        }
      }
    }

    let updatedDateRange: DateRangeType;
    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      updatedDateRange = { startDate: selectedDateStr, endDate: null };
    } else if (selectedDateStr >= dateRange.startDate) {
      updatedDateRange = { ...dateRange, endDate: selectedDateStr };
    } else {
      updatedDateRange = { startDate: selectedDateStr, endDate: null };
    }

    setDateRange(updatedDateRange);
    saveAllToStorage(planTitle, updatedDateRange, todoList, location);
  };

  // ==========================================
  // 【やりたいこと追加】即時保存を全項目オブジェクトに連動
  // ==========================================
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoInput.trim()) return;

    if (todoList.length >= 30) {
      setAlertMessage(
        "登録できるのは30項目までです。詰め込み過ぎると楽しめませんよ？",
      );
      return;
    }

    const newTodo: TodoItem = {
      id: Date.now(),
      text: todoInput.trim(),
    };

    const updatedList = [...todoList, newTodo];
    setTodoList(updatedList);
    saveAllToStorage(planTitle, dateRange, updatedList, location);
    setTodoInput("");
  };

  // ==========================================
  // 【やりたいこと削除】即時保存を全項目オブジェクトに連動
  // ==========================================
  const handleDeleteTodo = (id: number) => {
    const updatedList = todoList.filter((todo) => todo.id !== id);
    setTodoList(updatedList);
    saveAllToStorage(planTitle, dateRange, updatedList, location);
  };

  // 「旅程を登録する」押下時の最終チェック（目的地ガードを追加）
  const handleOpenConfirm = () => {
    if (!location || locationName === "目的地") {
      setAlertMessage(
        "目的地が正しく設定されていません。最初からやり直してください。",
      );
      return;
    }

    if (!dateRange.startDate) {
      setAlertMessage("カレンダーから日付を選択してください");
      return;
    }

    const trimmedTitle = planTitle.trim();

    if (!trimmedTitle) {
      setAlertMessage("タイトルの入力がありません。");
      return;
    }

    if (trimmedTitle.length > 30) {
      setAlertMessage("タイトルが長すぎます（30文字以内）");
      return;
    }

    setIsConfirmOpen(true);
  };

  // モーダル内で「確定」を押した時の最終登録処理
  const handleFinalConfirm = async () => {
    try {
      const newRecord = {
        title: planTitle.trim(),
        start_date: dateRange.startDate,
        end_date: dateRange.endDate || dateRange.startDate,
        destination: locationName,
        todos: todoList,
      };

      const { data, error } = await supabase
        .from("itineraries")
        .insert([newRecord])
        .select();

      if (error) {
        throw error;
      }

      setIsConfirmOpen(false);

      // 【データクリア】登録完了時に一時保存データを綺麗に削除
      clearTempStorage();

      if (onSavePlan && data && data.length > 0) {
        const item = data[0];
        const formattedNewPlan: Plan = {
          id: item.id,
          title: item.title,
          date: item.end_date
            ? `${item.start_date} 〜 ${item.end_date}`
            : item.start_date,
          dateRange: {
            startDate: item.start_date,
            endDate: item.end_date,
          },
          location: item.destination,
          todos: item.todos || [],
        };
        onSavePlan(formattedNewPlan);
      } else {
        onBack();
      }
    } catch (error) {
      console.error("保存エラー:", error);
      setAlertMessage("データベースへの保存に失敗しました。");
      setIsConfirmOpen(false);
    }
  };

  return (
    <div className="w-full max-w-xl min-h-screen bg-app-bg text-app-main p-6 space-y-6 mx-auto flex flex-col items-center">
      {/* 1. 上部小さめタイトルロゴ */}
      <HeaderLogo small={true} />

      {/* 2. 見出し（目的地） */}
      <div className="text-center space-y-1 w-full">
        <p className="text-sm md:text-base font-bold text-slate-600">
          📍 {locationName} へのルート候補です
        </p>
      </div>

      {/* 3. マップ表示エリア */}
      <div className="w-full flex justify-center">
        <RouteMapCard destination={location} />
      </div>

      {/* 4. やりたいことは何ですか？ (ToDoリスト) */}
      <div className="space-y-3 w-full">
        <h3 className="text-center font-bold text-slate-700 text-lg md:text-xl">
          やりたいことは何ですか？
        </h3>
        <form onSubmit={handleAddTodo} className="flex gap-2">
          <input
            type="text"
            value={todoInput}
            onChange={(e) => setTodoInput(e.target.value)}
            placeholder="例：浅草寺に行く"
            maxLength={100}
            className="flex-1 py-2.5 px-4 rounded-full bg-white text-slate-800 text-sm shadow-sm border border-white/60 focus:outline-none"
          />
          <button
            type="submit"
            className="py-2.5 px-5 bg-app-accent text-app-main font-bold text-sm rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all"
          >
            追加
          </button>
        </form>

        <TodoList todos={todoList} onDeleteTodo={handleDeleteTodo} />
      </div>

      {/* 5. いつ行きますか？ */}
      <div className="space-y-3 text-center w-full flex flex-col items-center">
        <h3 className="font-bold text-slate-700 text-lg md:text-xl">
          いつ行きますか？
        </h3>
        {dateRange.startDate && (
          <p className="text-sm md:text-base font-extrabold text-app-accent tracking-wide bg-app-accent/10 py-1.5 px-3 rounded-full inline-block">
            📅 {formattedDateText}
          </p>
        )}
        <div className="w-full flex justify-center">
          <CalendarCard
            onDateSelect={handleDateSelect}
            dateRange={dateRange}
            plans={plans}
          />
        </div>
      </div>

      {/* 6. 予定を立てますか？ */}
      <div className="space-y-3 text-center pt-2 w-full">
        <h3 className="font-bold text-slate-700 text-lg md:text-xl">
          予定を立てますか？
        </h3>

        <div className="space-y-1">
          <input
            type="text"
            value={planTitle}
            onChange={handleTitleChange}
            placeholder="タイトルを入れてください（30文字以内）"
            className={`w-full py-2.5 px-4 rounded-full bg-white text-slate-800 text-sm shadow-sm border focus:outline-none text-center truncate transition-colors ${
              isTitleTooLong
                ? "border-red-500 text-red-600 focus:ring-1 focus:ring-red-500"
                : "border-white/60"
            }`}
          />

          <div className="flex justify-between items-center px-4 text-xs font-bold">
            <span className="text-red-500">
              {isTitleTooLong && "※ タイトルは30文字以内で入力してください"}
            </span>
          </div>
        </div>

        {/* ボタン周り */}
        <div className="pt-2 space-y-2 w-full flex flex-col items-center">
          <button
            type="button"
            onClick={handleOpenConfirm}
            className="w-full py-3 bg-app-accent text-app-main font-bold text-base rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all"
          >
            旅程を登録する
          </button>

          {/* 戻るボタン */}
          <div className="w-full flex justify-start mt-2">
            <button
              type="button"
              onClick={() => {
                clearTempStorage();
                onBack();
              }}
              className="px-6 py-2 bg-slate-200 text-slate-600 font-bold rounded-full shadow-md hover:bg-slate-300 transition text-sm"
            >
              戻る
            </button>
          </div>
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

      {/* 8. 登録確認用統一モーダル */}
      <CustomModal
        isOpen={isConfirmOpen}
        title={planTitle}
        subtitle={`${locationName} | 📅 ${formattedDateText}`}
        message="この旅程を登録しますか？"
        type="confirm"
        okText="登録する"
        cancelText="キャンセル"
        onConfirm={handleFinalConfirm}
        onClose={() => setIsConfirmOpen(false)}
      />
    </div>
  );
}
