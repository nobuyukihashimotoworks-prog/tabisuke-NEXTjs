"use client";

import { useState } from "react";
import { Plan } from "@/types/plan";
import HeaderLogo from "./HeaderLogo";
import CalendarCard from "./CalendarCard";
import CustomModal from "./CustomModal";
import { supabase } from "@/utils/supabase";

interface DateRangeType {
  startDate: string | null;
  endDate: string | null;
}

interface PlanEditProps {
  plan?: Plan | null;
  plans?: Plan[];
  onBack: () => void;
  onUpdatePlan?: (updatedPlan: Plan) => void;
}

export default function PlanEdit({
  plan,
  plans = [],
  onBack,
  onUpdatePlan,
}: PlanEditProps) {
  const [title, setTitle] = useState(plan?.title || "");

  // 単日（plan.date）または 期間（plan.dateRange）に対応
  const [dateRange, setDateRange] = useState<DateRangeType>({
    startDate: plan?.dateRange?.startDate || plan?.date || null,
    endDate: plan?.dateRange?.endDate || plan?.date || null,
  });

  // モーダルの表示ステート ("none" | "alert" | "confirm" | "complete")
  const [modalState, setModalState] = useState<
    "none" | "alert" | "confirm" | "complete"
  >("none");
  const [alertMessage, setAlertMessage] = useState("");

  // タイトルの文字数が30文字を超えているかどうかの判定フラグ
  const isTitleTooLong = title.length > 30;

  // 指定された日付（YYYY-MM-DD）が「自分自身を除く」既存の旅程と重複しているかチェックする関数
  const isDateBooked = (dateStr: string) => {
    return plans.some((p) => {
      // 編集中の自分自身のプランIDと一致する場合は、重複チェックの対象外（除外）にする
      if (p.id === plan?.id) return false;
      const start = p.dateRange?.startDate;
      if (!start) return false;
      const end = p.dateRange?.endDate || start;
      return dateStr >= start && dateStr <= end;
    });
  };

  // カレンダーでタップされた時の期間選択処理
  const handleDateSelect = (selectedDateStr: string) => {
    // A. タップした単一の日付がすでに他の予約と重複しているかチェック
    if (isDateBooked(selectedDateStr)) {
      setAlertMessage("ダブルブッキングはできません！！");
      setModalState("alert");
      return;
    }

    // B. 期間選択時（開始日〜選択した終了日の間に他の既存予定が含まれていないかチェック）
    if (dateRange.startDate && !dateRange.endDate) {
      if (selectedDateStr >= dateRange.startDate) {
        const hasOverlap = plans.some((p) => {
          if (p.id === plan?.id) return false;
          const start = p.dateRange?.startDate;
          if (!start) return false;
          const end = p.dateRange?.endDate || start;
          return !(
            selectedDateStr < start ||
            (dateRange.startDate && dateRange.startDate > end)
          );
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

  // 「旅程を変更する」ボタンを押したとき
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
      setAlertMessage("タイトルが長すぎます（30文字以内）");
      setModalState("alert");
      return;
    }

    setModalState("confirm");
  };

  // 確認モーダルで「はい」を押したときのデータ更新処理
  const handleConfirm = async () => {
    if (!plan) return;

    const updatedTitle = title.trim() !== "" ? title.trim() : plan.title;
    const finalEndDate = dateRange.endDate || dateRange.startDate;

    try {
      // 1. Supabaseのitinerariesテーブルを更新
      const { error } = await supabase
        .from("itineraries")
        .update({
          title: updatedTitle,
          start_date: dateRange.startDate,
          end_date: finalEndDate,
        })
        .eq("id", plan.id);

      if (error) {
        throw error;
      }

      // 2. アプリ側の状態（親コンポーネント）を更新
      const updatedPlan: Plan = {
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
    } catch (error) {
      console.error("更新エラー:", error);
      setAlertMessage("データベースの更新に失敗しました。");
      setModalState("alert");
    }
  };

  // 完了モーダルで「OK」を押したとき（Homeへ戻る）
  const handleCompleteOK = () => {
    setModalState("none");
    onBack();
  };

  return (
    // 他の画面と完全に共通のコンテナ幅（max-w-xl）と中央揃え（mx-auto）を適用
    <div className="w-full max-w-xl min-h-screen flex flex-col bg-app-bg p-6 space-y-6 mx-auto relative items-center">
      {/* 1. ヘッダーロゴ（大きなサイズで他の画面と統一） */}
      <HeaderLogo />

      {/* 2. 現状のタイトル & 案内 */}
      <div className="text-center pt-2 w-full space-y-2">
        <h2 className="text-xl md:text-2xl font-bold text-app-main truncate px-4">
          {plan?.title || "現状のタイトル"}
        </h2>
        <p className="text-lg md:text-xl font-bold text-slate-700 mt-2">
          いつ行きますか？
        </p>
      </div>

      {/* 3. カレンダー（PC版で540pxのカードサイズに綺麗に中央配置） */}
      <div className="w-full flex justify-center">
        <CalendarCard
          onDateSelect={handleDateSelect}
          dateRange={dateRange}
          plans={plans}
        />
      </div>

      {/* 4. フォーム & ボタンエリア */}
      <div className="flex flex-col items-center space-y-4 pt-2 w-full">
        <p className="text-lg md:text-xl font-bold text-slate-700">
          予定を立て直しますか？
        </p>

        <div className="w-full space-y-1">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="新しいタイトルを入れてください（30文字以内）"
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
          </div>
        </div>

        {/* 旅程を変更するボタン */}
        <button
          type="button"
          onClick={handleOpenConfirm}
          className="w-full py-4 bg-app-accent text-app-main text-base md:text-lg font-bold rounded-full shadow-md hover:opacity-90 transition active:scale-95"
        >
          旅程を変更する
        </button>

        {/* 戻るボタン（他の画面と揃えて完全に左寄せに配置） */}
        <div className="w-full flex justify-start mt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 bg-slate-200 text-slate-600 font-bold rounded-full shadow-md hover:bg-slate-300 transition text-sm"
          >
            戻る
          </button>
        </div>
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
