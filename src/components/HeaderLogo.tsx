interface HeaderLogoProps {
  small?: boolean;
}

export default function HeaderLogo({ small = false }: HeaderLogoProps) {
  return (
    <div className="text-center pt-4">
      <h1
        className={`font-pacifico logo-stroke drop-shadow-sm ${
          small ? "text-5xl" : "text-6xl md:text-7xl"
        }`}
      >
        "Tabisuke"
      </h1>
    </div>
  );
}
