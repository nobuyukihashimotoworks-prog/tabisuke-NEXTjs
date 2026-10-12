// ① このコンポーネントが受け取るプロパティの型を定義する（インターフェース）
interface HeaderLogoProps {
  small?: boolean; // 「?」をつけることで、省略可能（undefinedでもOK）という意味になります
}

// ② 引数に型注釈（: HeaderLogoProps）を付与する
export default function HeaderLogo({ small = false }: HeaderLogoProps) {
  return (
    <div className="text-center pt-4">
      <h1
        className={`font-pacifico logo-stroke drop-shadow-sm ${
          small ? "text-3xl" : "text-5xl"
        }`}
      >
        "Tabisuke"
      </h1>
    </div>
  );
}
