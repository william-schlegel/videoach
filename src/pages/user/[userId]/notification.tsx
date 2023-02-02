import { useRouter } from "next/router";
import { useForm, type SubmitHandler } from "react-hook-form";
import type { GetServerSidePropsContext } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { toast } from "react-toastify";
import Layout from "@root/src/components/layout";
import { isCUID } from "@lib/checkValidity";
import { trpc } from "@trpcclient/trpc";

function Notification() {
  return <div>Notification</div>;
}
export default Notification;

export async function getServerSideProps({
  locale,
}: GetServerSidePropsContext) {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "auth", "home"],
        nextI18nConfig
      )),
    },
  };
}
