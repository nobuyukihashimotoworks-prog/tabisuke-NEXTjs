export default function ItineraryList({ items, onDeleteItem }) {
  if (items.length === 0) {
    return (
      <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 shadow-md border border-white/60 text-center space-y-2">
        <div className="text-2xl">📝</div>
        <p className="text-xs font-bold text-slate-500">
          まだ旅程にスポットが登録されていません
        </p>
        <p className="text-[10px] text-slate-400">
          上の検索バーから行きたい場所を検索して追加してみましょう！
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-white/60 space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
          <span>🚩</span> 登録済みの旅程リスト
        </h3>
        <span className="text-xs bg-app-accent/30 text-app-main px-2 py-0.5 rounded-full font-bold">
          {items.length} 件
        </span>
      </div>

      <ul className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {items.map((item, index) => (
          <li
            key={item.id}
            className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between transition-all animate-fade-in"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-app-main text-white font-bold text-xs flex items-center justify-center">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {item.location}
                </p>
                <p className="text-[10px] text-slate-400">
                  {item.createdAt} 追加
                </p>
              </div>
            </div>

            <button
              onClick={() => onDeleteItem(item.id)}
              className="flex-shrink-0 text-slate-300 hover:text-rose-500 text-sm p-1 transition-colors"
              title="削除"
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
