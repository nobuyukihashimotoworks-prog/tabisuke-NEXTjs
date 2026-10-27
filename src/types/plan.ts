// 1. やりたいこと（Todo）の型
export interface Todo {
  id: number;
  text: string;
}

// 2. 日程（開始日・終了日）の型
export interface DateRange {
  startDate: string | null;
  endDate: string | null;
}

// 3. 旅程（Plan）全体の型
export interface Plan {
  id: number;
  title: string;
  // 目的地（Google Placesのオブジェクト、または文字列に対応）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  location?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  destination?: any;
  date?: string;
  dateRange?: DateRange;
  todos: Todo[];
}
