import { Todo } from "@/types/plan"; // 1. 昨日作ったTodo型をインポート

// 2. このコンポーネントが受け取るPropsの型を定義
interface TodoListProps {
  todos: Todo[];                    // Todo型の配列
  onDeleteTodo: (id: number) => void; // 削除するID（数値）を受け取り、何も返さない関数
  onAddClick?: () => void;          // 省略可能な追加ボタンのクリックハンドラー
}

export default function TodoList({ todos, onDeleteTodo, onAddClick }: TodoListProps) {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm space-y-3 min-h-[100px] flex flex-col justify-center">
      {todos && todos.length > 0 ? (
        <>
          {/* 10個を超えたらスクロールするリスト領域 */}
          <div className="max-h-60 overflow-y-auto space-y-2.5 pr-1">
            <ul className="space-y-2.5">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center justify-between text-slate-700 text-sm font-medium"
                >
                  <span className="flex items-center gap-1.5 truncate pr-2">
                    <span>・</span>
                    <span className="truncate">{todo.text}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onDeleteTodo(todo.id)}
                    className="py-1 px-3 bg-[#d0f0ec] text-slate-700 text-xs font-bold rounded-full hover:opacity-80 shadow-sm flex-shrink-0"
                  >
                    削除
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* リストが存在するときの「+ 追加」ボタン */}
          {onAddClick && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onAddClick}
                className="py-1 px-3 bg-[#d0f0ec] text-slate-700 text-xs font-bold rounded-full hover:opacity-80 shadow-sm"
              >
                + 追加
              </button>
            </div>
          )}
        </>
      ) : (
        /* リストが0件のときの表示 */
        <div className="flex items-center justify-between px-2">
          <span className="text-slate-300 font-bold text-sm tracking-wide">
            やりたいこと、ないですか？
          </span>
          {onAddClick && (
            <button
              type="button"
              onClick={onAddClick}
              className="py-1 px-3 bg-[#d0f0ec] text-slate-700 text-xs font-bold rounded-full hover:opacity-80 shadow-sm"
            >
              追加
            </button>
          )}
        </div>
      )}
    </div>
  );
}