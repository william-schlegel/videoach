import Head from "next/head";
import { type ReactNode } from "react";
import Footer from "./footer";
import Navbar from "./navbar";

type Props = {
  children: ReactNode;
};

export default function Layout({ children }: Props) {
  return (
    <>
      <Head>
        <title>Videoach</title>
        <meta name="description" content="Management de clubs de sport" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen flex-1 flex-col" data-theme="acid">
        <Navbar />
        <main className="h-full bg-gray-100">{children}</main>
        <Footer />
      </div>
    </>
  );
}
