import { useState, useEffect } from "react";
import "./App.css";
import HeaderLogo from "./components/HeaderLogo";
import GoogleMapCard from "./components/GoogleMapCard";
import CalendarCard from "./components/CalendarCard";
import SearchBar from "./components/SearchBar";
import SearchModal from "./components/SearchModal";
import PlanRegister from "./components/PlanRegister";
import PlanDetail from "./components/PlanDetail";
import PlanEdit from "./components/PlanEdit";
import CustomModal from "./components/CustomModal";

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

const STORAGE_KEY = "tabisuke_plans";

export default function App() {
  const [message] = useState(() => {
    const randomIndex = Math.floor(Math.random() * MESSAGES.length);
    return MESSAGES[randomIndex];
  });

  // 地点情報（文字列 または { description, placeId, mainText... } オブジェクト）
  const [searchLocation, setSearchLocation] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  // 登録完了モーダルの状態管理
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);

  // 画面状態 ('home' | 'register' | 'detail' | 'edit')
  const [currentScreen, setCurrentScreen] = useState("home");

  // 保存された旅程リスト
  const [plans, setPlans] = useState(() => {
    const savedPlans = localStorage.getItem(STORAGE_KEY);
    return savedPlans ? JSON.parse(savedPlans) : [];
  });
  const [selectedPlan, setSelectedPlan] = useState(null);

  // plans が変更されるたびに localStorage へ自動保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  }, [plans]);

  // アプリ起動時に現在地（GPS）を1度だけ自動取得する処理
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          // GPSの座標をセット
          setSearchLocation(userLocation);
        },
        (error) => {
          console.warn("位置情報の取得に失敗または拒否されました:", error);
          // 取得拒否や失敗時は null のまま（デフォルト位置を表示）
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  }, []);

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setCurrentScreen("detail");
  };

  const handleDeletePlan = (planId) => {
    setPlans((prev) => prev.filter((p) => p.id !== planId));
  };

  const handleUpdatePlan = (updatedPlan) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p)),
    );
    setSelectedPlan(updatedPlan);
  };

  // 検索実行時（SearchBarから地点データ/文字列を受け取る）
  const handleSearchSubmit = (locationData) => {
    setPendingLocation(locationData);
    setIsModalOpen(true);
  };

  // 確認ダイアログで「はい」を押した時（正確な地点データを引き継いで登録画面へ）
  const handleConfirmLocation = (confirmedLocation) => {
    // SearchModal から返されたデータ、または pendingLocation をセット
    const finalLocation = confirmedLocation || pendingLocation;
    setSearchLocation(finalLocation);
    setIsModalOpen(false);
    setCurrentScreen("register");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // 旅程保存時の処理
  const handleSavePlan = (newPlan) => {
    setPlans((prev) => [...prev, newPlan]);
    setIsSaveModalOpen(true);
  };

  // 登録完了モーダルの「OK」を押した時の処理
  const handleSaveModalClose = () => {
    setIsSaveModalOpen(false);
    setCurrentScreen("home");
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-main flex flex-col items-center">
      {/* 1. 登録画面 */}
      {currentScreen === "register" && (
        <PlanRegister
          location={searchLocation}
          onBack={() => setCurrentScreen("home")}
          onSavePlan={handleSavePlan}
          plans={plans}
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
          /* 【修正点】編集画面でも既存の全予定との日付重複（ダブルブッキング）チェックを行えるよう、plansを渡す */
          plans={plans}
        />
      )}

      {/* 4. HOME画面 */}
      {currentScreen === "home" && (
        <div className="w-full max-w-md min-h-screen flex flex-col bg-app-bg p-6 space-y-6">
          <HeaderLogo />

          <div className="text-center pt-2 min-h-[40px] flex items-center justify-center">
            {message && (
              <h2 className="text-2xl font-bold tracking-wide text-app-main animate-fade-in">
                {message}
              </h2>
            )}
          </div>

          <SearchBar onSearch={handleSearchSubmit} />
          <GoogleMapCard location={searchLocation} />

          {/* 【修正】「旅行スケジュールの確認」のタイトルを追加 */}
          <div className="text-center pt-2">
            <h3 className="text-lg font-bold text-app-main tracking-wide">
              旅行スケジュールの確認
            </h3>
          </div>

          <CalendarCard
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onPlanSelect={handlePlanSelect}
            plans={plans}
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
        onClose={handleSaveModalClose}
      />
    </div>
  );
}
