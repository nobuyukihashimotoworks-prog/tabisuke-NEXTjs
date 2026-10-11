import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let isInitialized = false;

// 各コンポーネントから必要なライブラリを読み込む共通関数
export const loadGoogleMapsLibrary = async (name: string) => {
  if (!isInitialized) {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    isInitialized = true;
  }
  return importLibrary(name);
};
