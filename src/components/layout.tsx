import useLocalStorage from "@lib/useLocalstorage";
import Head from "next/head";
import { useEffect, useRef, type ReactNode } from "react";
import Footer from "./footer";
import Navbar from "./navbar";

type Props = {
  children: ReactNode;
};

export type Themes = "light" | "dark" | "cupcake" | "cyberpunk";

export default function Layout({ children }: Props) {
  const [theme, setTheme] = useLocalStorage<Themes>("theme", "cupcake");
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
        className="flex h-screen flex-1 flex-col bg-base-200"
        data-theme="cupcake"
      >
        <Navbar
          theme={theme}
          onChangeTheme={(newTheme) => setTheme(newTheme)}
        />
        <main className="bg-base-200 pb-4">{children}</main>
        <Footer />
      </div>
    </>
  );
}
