export default function SearchModal({ isOpen, location, onClose, onConfirm }) {
  // モーダルが非表示、または場所データが存在しない場合は何も描画しない
  if (!isOpen || !location) return null;

  // location がオブジェクトで渡された場合と、文字列で渡された場合の両方に対応
  const isObject = typeof location === "object" && location !== null;

  // スポット名（メイン表示）
  const displayName = isObject
    ? location.mainText ||
      location.name ||
      location.description ||
      "選択したスポット"
    : location;

  // 補足住所（サブ表示：存在する場合のみ）
  const displayAddress = isObject
    ? location.secondaryText ||
      location.address ||
      (location.description !== displayName ? location.description : null)
    : null;

  return (
    // オーバーレイ（背景の暗転・アクセシビリティ対応）
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* モーダル本体カード */}
      <div className="bg-white rounded-3xl p-6 shadow-2xl w-full max-w-xs text-center space-y-4 border border-white/80 transform transition-all">
        <div className="text-3xl">📍</div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-700">
            ここに行きますか？
          </h3>
          {/* メインスポット名 */}
          <p className="text-xl font-extrabold text-app-main leading-tight break-words px-2">
            「{displayName}」
          </p>
          {/* 住所・補足情報（オブジェクトに住所が含まれる場合のみ表示） */}
          {displayAddress && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 px-1 font-normal">
              {displayAddress}
            </p>
          )}
        </div>

        <p className="text-xs text-slate-400">
          目的地としてマップ表示および旅程登録に進みます。
        </p>

        {/* ボタンエリア（「はい」を左、「いいえ」を右に配置） */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onConfirm(location)}
            className="flex-1 py-3 px-4 min-h-[44px] rounded-full bg-app-accent text-app-main font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all touch-manipulation"
          >
            はい
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 min-h-[44px] rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 active:bg-slate-100 transition-all touch-manipulation"
          >
            いいえ
          </button>
        </div>
      </div>
    </div>
  );
}
