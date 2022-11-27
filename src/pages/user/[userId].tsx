import { useRouter } from "next/router";

export default function Profile() {
  const router = useRouter();
  const { userId } = router.query;

  return <div>Profile {userId}</div>;
}
