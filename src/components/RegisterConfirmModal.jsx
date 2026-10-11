export default function RegisterConfirmModal({
  isOpen,
  formData,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  const { location, title, dateRange, todos } = formData || {};

  // 日付の表示文字列を作成
  const formattedDate = dateRange?.endDate
    ? `${dateRange.startDate} 〜 ${dateRange.endDate}`
    : dateRange?.startDate || "未設定";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-5">
        {/* ヘッダー */}
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <span>📋</span> 登録内容の確認
        </h2>

        {/* 内容一覧 */}
        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl text-xs font-bold text-slate-700">
          {/* タイトル */}
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">
              旅のタイトル
            </span>
            <span className="text-sm font-bold text-slate-800">
              {title || "（無題）"}
            </span>
          </div>

          {/* 目的地 */}
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">
              目的地
            </span>
            <span className="text-slate-700">📍 {location || "未設定"}</span>
          </div>

          {/* 日程 */}
          <div>
            <span className="text-[10px] text-slate-400 font-medium block">
              日程
            </span>
            <span className="text-slate-700">📅 {formattedDate}</span>
          </div>

          {/* やりたいことリスト */}
          {todos && todos.length > 0 && (
            <div>
              <span className="text-[10px] text-slate-400 font-medium block mb-1">
                やりたいこと（{todos.length}件）
              </span>
              <ul className="space-y-1 pl-1">
                {todos.map((todo) => (
                  <li key={todo.id} className="text-slate-600 font-medium">
                    ・ {todo.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ボタンエリア */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 text-slate-600 font-bold bg-slate-100 rounded-full hover:bg-slate-200 transition-colors text-xs"
          >
            修正する
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-3 text-app-main font-bold bg-app-accent rounded-full hover:opacity-90 transition-opacity text-xs shadow-md active:scale-95"
          >
            確定して登録
          </button>
        </div>
      </div>
    </div>
  );
}
