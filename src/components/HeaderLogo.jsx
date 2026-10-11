export default function HeaderLogo({ small = false }) {
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
