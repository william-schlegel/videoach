import type { FC } from "react";

type Props = {
  userId: string;
};

const UserHomePage: FC<Props> = ({ userId }: Props) => {
  return <div>UserHomePage {userId}</div>;
};

export default UserHomePage;
