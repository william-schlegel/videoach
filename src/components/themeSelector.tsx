import useLocalStorage from "@lib/useLocalstorage";
import { useEffect } from "react";

export const Themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
] as const;
export type TThemes = typeof Themes[number];

type Props = { onSelect: (t: TThemes) => void };

const ThemeSelector = ({ onSelect }: Props) => {
  const [theme, setTheme] = useLocalStorage<TThemes>("pageTheme", "cupcake");

  useEffect(() => {
    onSelect(theme);
  }, [theme, onSelect]);

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as TThemes)}
      className="w-fit"
    >
      {Themes.map((theme) => (
        <option key={theme} value={theme}>
          {theme}
        </option>
      ))}
    </select>
  );
};

export default ThemeSelector;
