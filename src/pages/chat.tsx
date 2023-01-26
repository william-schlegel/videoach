import { isCUID } from "@lib/checkValidity.js";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import Layout from "@root/src/components/layout";
import { trpc } from "@trpcclient/trpc.js";
import { type GetServerSidePropsContext } from "next";
import { useSession } from "next-auth/react";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useEffect } from "react";
import { StreamChat } from "stream-chat";
import { env } from "../env/client.mjs";

const client = StreamChat.getInstance(env.NEXT_PUBLIC_STREAMCHAT_API_KEY);

const Chat = () => {
  const { t } = useTranslation("dashboard");
  const { data: sessionData } = useSession();
  const user = trpc.users.getUserById.useQuery(sessionData?.user?.id ?? "", {
    enabled: isCUID(sessionData?.user?.id),
    async onSuccess(data) {
      if (data && data.chatToken) {
        const token = data.chatToken;
        await client.connectUser(
          {
            id: data.id,
            name: data.name ?? "",
            image: data.image,
          },
          token
        );
      }
    },
  });

  return (
    <Layout className="container mx-auto my-2 flex flex-col gap-2">
      <h1 className="flex justify-between">{t("member.my-chat")}</h1>
    </Layout>
  );
};

export default Chat;

export const getServerSideProps = async ({
  locale,
}: GetServerSidePropsContext) => {
  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "dashboard"],
        nextI18nConfig
      )),
    },
  };
};
