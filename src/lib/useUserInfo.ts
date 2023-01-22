import { trpc } from "@trpcclient/trpc";
import { isCUID } from "@lib/checkValidity";
import { differenceInDays, startOfToday } from "date-fns";
import { useState } from "react";
import { type Feature } from "@prisma/client";
import { useSession } from "next-auth/react";

export default function useUserInfo(userId?: string | null) {
  const [remainTrial, setRemainTrial] = useState(0);
  const [features, setFeatures] = useState<Feature[]>([]);
  const { data: sessionData } = useSession();

  const uId = userId ?? sessionData?.user?.id ?? "";

  trpc.users.getUserById.useQuery(uId, {
    enabled: isCUID(uId),
    onSuccess(data) {
      const trialLimit = data?.trialUntil ?? new Date(0);
      const today = startOfToday();
      setRemainTrial(differenceInDays(trialLimit, today));
      setFeatures(data?.pricing?.features.map((f) => f.feature) ?? []);
    },
  });

  return { trial: remainTrial > 0, remainTrial, features };
}
