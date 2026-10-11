import { useState } from "react";
import HeaderLogo from "./HeaderLogo";
import CalendarCard from "./CalendarCard";
import CustomModal from "./CustomModal";

// 【修正点】親コンポーネントから既存のプラン一覧 (plans) を受け取れるようにプロパティを追加
export default function PlanEdit({ plan, plans = [], onBack, onUpdatePlan }) {
  const [title, setTitle] = useState(plan?.title || "");

  // 単日（plan.date）または 期間（plan.dateRange）に対応
  const [dateRange, setDateRange] = useState({
    startDate: plan?.dateRange?.startDate || plan?.date || null,
    endDate: plan?.dateRange?.endDate || plan?.date || null,
  });

  // モーダルの表示ステート ("none" | "alert" | "confirm" | "complete")
  const [modalState, setModalState] = useState("none");
  const [alertMessage, setAlertMessage] = useState("");

  // 【修正点】タイトルの文字数が30文字を超えているかどうかの判定フラグ (設計書・新規登録画面と仕様を統一)
  const isTitleTooLong = title.length > 30;

  // 【修正点】指定された日付（YYYY-MM-DD）が「自分自身を除く」既存の旅程と重複しているかチェックする関数
  const isDateBooked = (dateStr) => {
    return plans.some((p) => {
      // 編集中の自分自身のプランIDと一致する場合は、重複チェックの対象外（除外）にする
      if (p.id === plan?.id) return false;
      const start = p.dateRange?.startDate;
      if (!start) return false;
      const end = p.dateRange?.endDate || start;
      return dateStr >= start && dateStr <= end;
    });
  };

  // カレンダーでタップされた時の期間選択処理（ダブルブッキング防止ロジックを追加）
  const handleDateSelect = (selectedDateStr) => {
    // 【修正点 A】タップした単一の日付がすでに他の予約と重複しているかチェック
    if (isDateBooked(selectedDateStr)) {
      setAlertMessage("ダブルブッキングはできません！！");
      setModalState("alert");
      return;
    }

    // 【修正点 B】期間選択時（開始日〜選択した終了日の間に他の既存予定が含まれていないかチェック）
    if (dateRange.startDate && !dateRange.endDate) {
      if (selectedDateStr >= dateRange.startDate) {
        const hasOverlap = plans.some((p) => {
          if (p.id === plan?.id) return false;
          const start = p.dateRange?.startDate;
          if (!start) return false;
          const end = p.dateRange?.endDate || start;
          return !(selectedDateStr < start || dateRange.startDate > end);
        });

        if (hasOverlap) {
          setAlertMessage(
            "選択した期間内に既存の予定が含まれているため、ダブルブッキングはできません！！",
          );
          setModalState("alert");
          return;
        }
      }
    }

    const { startDate, endDate } = dateRange;

    if (!startDate || (startDate && endDate)) {
      setDateRange({
        startDate: selectedDateStr,
        endDate: null,
      });
    } else if (startDate && !endDate) {
      if (selectedDateStr < startDate) {
        setDateRange({
          startDate: selectedDateStr,
          endDate: null,
        });
      } else {
        setDateRange({
          startDate,
          endDate: selectedDateStr,
        });
      }
    }
  };

  // 表示用の日付テキストフォーマット処理
  const getFormattedDateText = () => {
    if (dateRange.startDate && dateRange.endDate) {
      if (dateRange.startDate === dateRange.endDate) {
        return dateRange.startDate;
      }
      return `${dateRange.startDate} ～ ${dateRange.endDate}`;
    }
    return dateRange.startDate || "日付未選択";
  };

  // 「旅程を変更する」ボタンを押したとき（新規登録画面と同様の入力チェック・バリデーションを追加）
  const handleOpenConfirm = () => {
    // 1. 日付選択チェック
    if (!dateRange.startDate) {
      setAlertMessage("カレンダーから日付を選択してください");
      setModalState("alert");
      return;
    }

    const trimmedTitle = title.trim();

    // 2. タイトル未入力チェック
    if (!trimmedTitle) {
      setAlertMessage("タイトルの入力がありません。");
      setModalState("alert");
      return;
    }

    // 3. タイトル文字数制限チェック（30文字以内）
    if (trimmedTitle.length > 30) {
      setAlertMessage("タイトルは30文字以内で入力してください。");
      setModalState("alert");
      return;
    }

    setModalState("confirm");
  };

  // 確認モーダルで「はい」を押したときのデータ更新処理
  const handleConfirm = () => {
    const updatedTitle = title.trim() !== "" ? title.trim() : plan.title;
    const finalEndDate = dateRange.endDate || dateRange.startDate;

    const updatedPlan = {
      ...plan,
      title: updatedTitle,
      date: getFormattedDateText(),
      dateRange: {
        startDate: dateRange.startDate,
        endDate: finalEndDate,
      },
    };

    if (onUpdatePlan) {
      onUpdatePlan(updatedPlan);
    }

    setModalState("complete");
  };

  // 完了モーダルで「OK」を押したとき（Homeへ戻る）
  const handleCompleteOK = () => {
    setModalState("none");
    onBack();
  };

  return (
    <div className="w-full max-w-md min-h-screen flex flex-col bg-app-bg p-6 space-y-6 mx-auto relative">
      {/* 1. ヘッダーロゴ */}
      <HeaderLogo small={true} />

      {/* 2. 現状のタイトル & 案内 */}
      <div className="text-center pt-2">
        <h2 className="text-2xl font-bold text-app-main truncate px-4">
          {plan?.title || "現状のタイトル"}
        </h2>
        <p className="text-lg font-bold text-app-main mt-4">いつ行きますか？</p>
      </div>

      {/* 3. カレンダー（期間選択・重複チェック機能つき） */}
      {/* 【修正点】重複チェックを行うため、plans を CalendarCard にも渡す */}
      <CalendarCard
        onDateSelect={handleDateSelect}
        dateRange={dateRange}
        plans={plans}
      />

      {/* 4. フォーム & ボタンエリア */}
      <div className="flex flex-col items-center space-y-4 pt-2">
        <p className="text-lg font-bold text-app-main">
          予定を立て直しますか？
        </p>

        {/* 【修正点】新規登録画面と同様のタイトル入力欄（文字数制限・超過時の赤字エラー表示機能付き） */}
        <div className="w-full space-y-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="新しいタイトルを入れてください"
            maxLength={30}
            className={`w-full py-3 px-6 bg-white rounded-full text-center text-sm shadow-md focus:outline-none transition-colors border ${
              isTitleTooLong
                ? "border-red-500 text-red-600 focus:ring-1 focus:ring-red-500"
                : "border-white/60 text-slate-800"
            }`}
          />
          <div className="flex justify-between items-center px-4 text-xs font-bold">
            <span className="text-red-500">
              {isTitleTooLong && "※ タイトルは30文字以内で入力してください"}
            </span>
            <span
              className={
                isTitleTooLong
                  ? "text-red-500 ml-auto"
                  : "text-slate-400 ml-auto"
              }
            >
              {title.length}/30
            </span>
          </div>
        </div>

        {/* 旅程を変更するボタン */}
        <button
          type="button"
          onClick={handleOpenConfirm}
          className="w-full py-4 bg-app-accent text-app-main text-lg font-bold rounded-full shadow-md hover:opacity-90 transition active:scale-95"
        >
          旅程を変更する
        </button>

        {/* 戻るボタン */}
        <button
          type="button"
          onClick={onBack}
          className="self-start px-6 py-2 bg-slate-200 text-slate-600 font-bold rounded-full shadow-md hover:bg-slate-300 transition text-sm mt-2"
        >
          戻る
        </button>
      </div>

      {/* 5. 警告・アラート用モーダル */}
      <CustomModal
        isOpen={modalState === "alert"}
        message={alertMessage || "日付を選択してください"}
        type="alert"
        okText="OK"
        onClose={() => setModalState("none")}
      />

      {/* 6. 変更確認モーダル */}
      <CustomModal
        isOpen={modalState === "confirm"}
        title={title.trim() || plan?.title}
        subtitle={getFormattedDateText()}
        message="この旅程を変更しますか？"
        type="confirm"
        okText="はい"
        cancelText="いいえ"
        onConfirm={handleConfirm}
        onClose={() => setModalState("none")}
      />

      {/* 7. 変更完了モーダル */}
      <CustomModal
        isOpen={modalState === "complete"}
        message="日程変更が完了しました"
        type="alert"
        okText="OK"
        onClose={handleCompleteOK}
      />
    </div>
  );
}
