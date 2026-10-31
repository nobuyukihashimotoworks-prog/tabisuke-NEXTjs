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
// 【定数定義】ローカルストレージのキー名をマジックストリング回避のため定数化
// ==========================================
const TEMP_TODO_STORAGE_KEY = "tabisuke_temp_todos";

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

  // ==========================================
  // 【一時保存・復元処理】定数キーを使用してマウント時に読み込み
  // ==========================================
  const [todoList, setTodoList] = useState<TodoItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem(TEMP_TODO_STORAGE_KEY);
    if (saved) {
      try {
        setTodoList(JSON.parse(saved));
      } catch (e) {
        console.error("一時データの読み込みに失敗しました", e);
      }
    }
  }, []);

  const [planTitle, setPlanTitle] = useState("");

  // 1. 日付管理
  const [dateRange, setDateRange] = useState<DateRangeType>({
    startDate: null,
    endDate: null,
  });

  // 2. モーダル用の表示ステート
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // 目的地名の安全な取得
  const locationName =
    typeof location === "object" && location !== null
      ? location.mainText || location.name || location.description || "目的地"
      : location || "目的地";

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

  // カレンダーの日付選択
  const handleDateSelect = (selectedDateStr: string) => {
    // A. タップした単一の要素がすでに予約済みかチェック
    if (isDateBooked(selectedDateStr)) {
      setAlertMessage("ダブルブッキングはできません！！");
      return;
    }

    // B. 期間選択時（開始日〜選択した終了日の間に予約済みの日が含まれていないかチェック）
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

    // 通常の日付選択処理
    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      setDateRange({ startDate: selectedDateStr, endDate: null });
    } else if (selectedDateStr >= dateRange.startDate) {
      setDateRange({ ...dateRange, endDate: selectedDateStr });
    } else {
      setDateRange({ startDate: selectedDateStr, endDate: null });
    }
  };

  // ==========================================
  // 【やりたいこと追加】定数キーを使用して即時保存
  // ==========================================
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!todoInput.trim()) return;

    // 30件上限チェック
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

    if (typeof window !== "undefined") {
      localStorage.setItem(TEMP_TODO_STORAGE_KEY, JSON.stringify(updatedList));
    }

    setTodoInput("");
  };

  // ==========================================
  // 【やりたいこと削除】定数キーを使用して即時保存
  // ==========================================
  const handleDeleteTodo = (id: number) => {
    const updatedList = todoList.filter((todo) => todo.id !== id);
    setTodoList(updatedList);

    if (typeof window !== "undefined") {
      localStorage.setItem(TEMP_TODO_STORAGE_KEY, JSON.stringify(updatedList));
    }
  };

  // 「旅程を登録する」押下時の最終チェック
  const handleOpenConfirm = () => {
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
      // 1. Supabaseのitinerariesテーブルに保存するデータ構造を作成
      const newRecord = {
        title: planTitle.trim(),
        start_date: dateRange.startDate,
        end_date: dateRange.endDate || dateRange.startDate,
        destination: locationName,
        todos: todoList,
      };

      // 2. Supabaseへインサート（挿入）
      const { data, error } = await supabase
        .from("itineraries")
        .insert([newRecord])
        .select();

      if (error) {
        throw error;
      }

      // 3. 確認モーダルを閉じる
      setIsConfirmOpen(false);

      // ==========================================
      // 【データクリア】定数キーを使用して一時保存データを削除
      // ==========================================
      if (typeof window !== "undefined") {
        localStorage.removeItem(TEMP_TODO_STORAGE_KEY);
      }

      // 4. 親コンポーネントに保存成功を通知する
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
            onChange={(e) => setPlanTitle(e.target.value)}
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
                if (typeof window !== "undefined") {
                  localStorage.removeItem(TEMP_TODO_STORAGE_KEY);
                }
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
