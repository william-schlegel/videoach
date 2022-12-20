import useLocalStorage from "@lib/useLocalstorage";
import Head from "next/head";
import { type ReactNode } from "react";
import Footer from "./footer";
import Navbar from "./navbar";

type Props = {
  children: ReactNode;
};

export type Themes = "light" | "dark" | "cupcake" | "cyberpunk";

export default function Layout({ children }: Props) {
  const [theme, setTheme] = useLocalStorage<Themes>("theme", "cupcake");
  return (
    <>
      <Head>
        <title>Videoach</title>
        <meta name="description" content="Management de clubs de sport" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div
        className="flex h-screen flex-1 flex-col bg-base-200"
        data-theme={theme}
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
