export default function TodoList({ todos, onDeleteTodo }) {
  if (!todos || todos.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/60 max-h-48 overflow-y-auto space-y-2">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className="flex items-center justify-between text-xs font-bold text-slate-700 py-1.5 border-b border-slate-100 last:border-none"
        >
          <span className="truncate pr-2">・ {todo.text}</span>
          <button
            type="button"
            onClick={() => onDeleteTodo(todo.id)}
            className="text-xs bg-rose-100 text-rose-500 px-2.5 py-0.5 rounded-full hover:bg-rose-200 transition-colors flex-shrink-0"
          >
            削除
          </button>
        </div>
      ))}
    </div>
  );
}
