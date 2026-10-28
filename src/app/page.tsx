"use client";

import { Plan } from "@/types/plan";
import { useState, useEffect, useCallback } from "react";
import HeaderLogo from "../components/HeaderLogo";
import GoogleMapCard from "../components/GoogleMapCard";
import SearchBar from "../components/SearchBar";
import SearchModal from "../components/SearchModal";
import PlanRegister from "../components/PlanRegister";
import PlanDetail from "../components/PlanDetail";
import PlanEdit from "../components/PlanEdit";
import CustomModal from "../components/CustomModal";
import dynamic from "next/dynamic";
import { supabase } from "@/utils/supabase";

// SSRを無効化してクライアント側でのみFullCalendarを安全に読み込む
const CalendarCard = dynamic(() => import("../components/CalendarCard"), {
  ssr: false,
});

const MESSAGES = [
  "どこへ行きましょうか？",
  "気分転換しに行きませんか？",
  "いい日旅立ち、なにをさがしに行きますか？",
  " さぁ、冒険だ",
  "『百聞は一見に如かず』私の好きな言葉です。",
  "井の中から出てみませんか？",
  " 大泉くん、そろそろ旅にでようか？",
  "行き先、無限大。",
  "息抜き、しにいきません？",
  "とりあえず行って考えるもアリ。",
];

export default function Home() {
  // 最初に空文字で初期化し、マウント後にブラウザ側でランダムなメッセージをセットする
  const [message, setMessage] = useState("");

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * MESSAGES.length);
    setMessage(MESSAGES[randomIndex]);
  }, []);

  // 地点情報
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [searchLocation, setSearchLocation] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pendingLocation, setPendingLocation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  // 登録完了モーダルの状態管理
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // 画面状態 ('home' | 'register' | 'detail' | 'edit')
  const [currentScreen, setCurrentScreen] = useState("home");

  // 保存された旅程リスト（最初は空配列からスタート）
  const [plans, setPlans] = useState<Plan[]>([]);

  // ★ Supabaseからデータを取得する処理を再利用可能な関数として定義
  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase.from("itineraries").select("*");

    if (error) {
      console.error("データ取得エラー:", error);
      return;
    }

    if (data) {
      // Supabaseのカラム構成をアプリ側の Plan 型に変換してセットする
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedPlans: Plan[] = data.map((item: any) => ({
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
        todos: item.days || [],
      }));

      setPlans(formattedPlans);
    }
  }, []);

  // 起動時にSupabaseからデータを取得する
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // アプリ起動時に現在地（GPS）を1度だけ自動取得する処理
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setSearchLocation(userLocation);
        },
        (error) => {
          console.warn("位置情報の取得に失敗または拒否されました:", error);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  }, []);

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
    setCurrentScreen("detail");
  };

  const handleDeletePlan = (planId: string | number) => {
    setPlans((prev) => prev.filter((p) => String(p.id) !== String(planId)));
  };

  const handleUpdatePlan = (updatedPlan: Plan) => {
    setPlans((prev) =>
      prev.map((p) =>
        String(p.id) === String(updatedPlan.id) ? updatedPlan : p,
      ),
    );
    setSelectedPlan(updatedPlan);
  };

  // 検索実行時
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSearchSubmit = (locationData: any) => {
    setPendingLocation(locationData);
    setIsModalOpen(true);
  };

  // 確認ダイアログで「はい」を押した時
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleConfirmLocation = (confirmedLocation: any) => {
    const finalLocation = confirmedLocation || pendingLocation;
    setSearchLocation(finalLocation);
    setIsModalOpen(false);
    setCurrentScreen("register");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 旅程保存時の処理（PlanRegisterから呼ばれる）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSavePlan = (newPlan: any) => {
    // 状態のステート更新（必要に応じて）
    setPlans((prev) => [...prev, newPlan]);
    // ★ 登録完了モーダルを開く
    setIsSaveModalOpen(true);
  };

  // 登録完了モーダルの「OK」を押した時の処理
  const handleSaveModalClose = () => {
    setIsSaveModalOpen(false); // モーダルを閉じる
    setCurrentScreen("home"); // ホーム画面に戻る
    fetchPlans(); // 最新データを再取得してカレンダーに反映
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-main flex flex-col items-center">
      {/* 1. 登録画面 */}
      {currentScreen === "register" && (
        <PlanRegister
          location={searchLocation}
          onBack={() => {
            setCurrentScreen("home");
            fetchPlans(); // ★ 登録画面から戻る時に最新データを再取得する
          }}
          onSavePlan={handleSavePlan}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          plans={plans as any}
        />
      )}

      {/* 2. 旅程詳細画面 */}
      {currentScreen === "detail" && (
        <PlanDetail
          plan={selectedPlan}
          onBack={() => setCurrentScreen("home")}
          onDeletePlan={handleDeletePlan}
          onUpdatePlan={handleUpdatePlan}
          onEditPlan={() => setCurrentScreen("edit")}
        />
      )}

      {/* 3. 旅程日程変更画面 */}
      {currentScreen === "edit" && (
        <PlanEdit
          plan={selectedPlan}
          onBack={() => setCurrentScreen("home")}
          onUpdatePlan={handleUpdatePlan}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          plans={plans as any}
        />
      )}

      {/* 4. HOME画面 */}
      {currentScreen === "home" && (
        <div className="w-full max-w-xl min-h-screen flex flex-col bg-app-bg p-6 space-y-6 mx-auto">
          <HeaderLogo />

          <div className="text-center pt-2 min-h-[40px] flex items-center justify-center">
            {message && (
              // PC版でメッセージが小さく見えないよう md:text-3xl を追加
              <h2 className="text-2xl md:text-3xl font-bold tracking-wide text-app-main animate-fade-in">
                {message}
              </h2>
            )}
          </div>

          <SearchBar onSearch={handleSearchSubmit} />
          <GoogleMapCard location={searchLocation} />

          <div className="text-center pt-2">
            {/* PC版でセクション見出しが小さく見えないよう md:text-xl を追加 */}
            <h3 className="text-xl md:text-2xl font-bold text-app-main tracking-wide">
              旅行スケジュールの確認
            </h3>
            {selectedDate && (
              <p className="text-xs md:text-sm text-zinc-500 mt-1">
                選択中: {selectedDate}
              </p>
            )}
          </div>

          <CalendarCard
            onDateSelect={handleDateSelect}
            onPlanSelect={handlePlanSelect}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            plans={plans as any}
          />

          <SearchModal
            isOpen={isModalOpen}
            location={pendingLocation}
            onClose={handleCloseModal}
            onConfirm={handleConfirmLocation}
          />
        </div>
      )}

      {/* 登録完了用の統一モーダル */}
      <CustomModal
        isOpen={isSaveModalOpen}
        message="登録が完了しました"
        type="alert"
        okText="OK"
        onConfirm={handleSaveModalClose}
        onClose={handleSaveModalClose}
      />
    </div>
  );
}
