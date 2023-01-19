import useLocalStorage from "@lib/useLocalstorage";
import Head from "next/head";
import { useEffect, useRef, type ReactNode } from "react";
import Footer from "./footer";
import Navbar from "./navbar";
import { type TThemes } from "./themeSelector";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function Layout({ children, className }: Props) {
  const [theme, setTheme] = useLocalStorage<TThemes>("theme", "cupcake");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wrapperRef.current?.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <>
      <Head>
        <title>Videoach</title>
        <meta name="description" content="Management de clubs de sport" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        ref={wrapperRef}
        className="flex min-h-screen flex-col bg-base-200"
        data-theme="cupcake"
      >
        <Navbar
          theme={theme}
          onChangeTheme={(newTheme) => setTheme(newTheme)}
        />
        <main className={`bg-base-200 pb-4 ${className ?? ""}`}>
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
