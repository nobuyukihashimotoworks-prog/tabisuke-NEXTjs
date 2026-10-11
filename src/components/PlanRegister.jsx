import { useState } from "react";
import HeaderLogo from "./HeaderLogo";
import CalendarCard from "./CalendarCard";
import RouteMapCard from "./RouteMapCard";
import TodoList from "./TodoList";
import CustomModal from "./CustomModal";

export default function PlanRegister({
  location,
  onBack,
  onSavePlan,
  plans = [],
}) {
  const [todoInput, setTodoInput] = useState("");
  const [todoList, setTodoList] = useState([]);
  const [planTitle, setPlanTitle] = useState("");

  // 1. 日付管理
  const [dateRange, setDateRange] = useState({
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
    : dateRange.startDate;

  // 30文字を超えているかどうかの判定フラグ (設計書更新後の仕様: 30文字制限)
  const isTitleTooLong = planTitle.length > 30;

  // 指定された日付（YYYY-MM-DD）が既存の旅程と重複しているかチェック
  const isDateBooked = (dateStr) => {
    return plans.some((plan) => {
      const start = plan.dateRange?.startDate;
      if (!start) return false;
      const end = plan.dateRange?.endDate || start;
      return dateStr >= start && dateStr <= end;
    });
  };

  // カレンダーの日付選択
  const handleDateSelect = (selectedDateStr) => {
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
          return !(selectedDateStr < start || dateRange.startDate > end);
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

  // やりたいこと（ToDo）の追加（指摘4対応: 30件上限チェック）
  const handleAddTodo = (e) => {
    e.preventDefault();
    if (!todoInput.trim()) return;

    // 30件上限チェック
    if (todoList.length >= 30) {
      setAlertMessage(
        "登録できるのは30項目までです。詰め込み過ぎると楽しめませんよ？",
      );
      return;
    }

    const newTodo = {
      id: Date.now(),
      text: todoInput.trim(),
    };
    setTodoList((prev) => [...prev, newTodo]);
    setTodoInput("");
  };

  // やりたいことの削除
  const handleDeleteTodo = (id) => {
    setTodoList((prev) => prev.filter((todo) => todo.id !== id));
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
      setAlertMessage("タイトルは30文字以内で入力してください。");
      return;
    }

    setIsConfirmOpen(true);
  };

  // モーダル内で「確定」を押した時の最終登録処理
  const handleFinalConfirm = () => {
    const newPlan = {
      id: Date.now(),
      location: location,
      title: planTitle.trim(),
      date: formattedDateText,
      dateRange: dateRange,
      todos: todoList,
    };

    setIsConfirmOpen(false);
    onSavePlan(newPlan);
  };

  return (
    <div className="w-full max-w-md bg-app-bg text-app-main p-6 space-y-6">
      {/* 1. 上部小さめタイトルロゴ */}
      <HeaderLogo small={true} />

      {/* 2. 見出し（目的地） */}
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-slate-600">
          📍 {locationName} へのルート候補です
        </p>
      </div>

      {/* 3. マップ表示エリア */}
      <RouteMapCard destination={location} />

      {/* 4. やりたいことは何ですか？ (ToDoリスト) */}
      <div className="space-y-3">
        <h3 className="text-center font-bold text-slate-700">
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

      {/* 5. いつ行きますか？ (FullCalendarによる日付選択) */}
      <div className="space-y-3 text-center">
        <h3 className="font-bold text-slate-700">いつ行きますか？</h3>
        {dateRange.startDate && (
          <p className="text-sm font-extrabold text-app-accent tracking-wide bg-app-accent/10 py-1.5 px-3 rounded-full inline-block">
            📅 {formattedDateText}
          </p>
        )}
        <CalendarCard
          onDateSelect={handleDateSelect}
          dateRange={dateRange}
          plans={plans}
        />
      </div>

      {/* 6. 予定を立てますか？ (タイトル入力 ＆ 保存) */}
      <div className="space-y-3 text-center pt-2">
        <h3 className="font-bold text-slate-700">予定を立てますか？</h3>

        <div className="space-y-1">
          <input
            type="text"
            value={planTitle}
            onChange={(e) => setPlanTitle(e.target.value)}
            placeholder="タイトルを入れてください（例：浅草観光）"
            maxLength={30}
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
            <span
              className={isTitleTooLong ? "text-red-500" : "text-slate-400"}
            >
              {planTitle.length}/30
            </span>
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <button
            type="button"
            onClick={handleOpenConfirm}
            className="w-full py-3 bg-app-accent text-app-main font-bold text-base rounded-full shadow-md hover:opacity-90 active:scale-95 transition-all"
          >
            旅程を登録する
          </button>
          <button
            type="button"
            onClick={onBack}
            className="py-1.5 px-4 bg-slate-200 text-slate-600 font-bold text-xs rounded-full hover:bg-slate-300"
          >
            戻る
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
