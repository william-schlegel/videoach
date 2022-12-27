import { authOptions } from "@auth/[...nextauth]";
import { Role } from "@prisma/client";
import { type GetServerSidePropsContext } from "next";
import { unstable_getServerSession } from "next-auth";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import nextI18nConfig from "@root/next-i18next.config.mjs";
import { useSession } from "next-auth/react";
import { trpc } from "@trpcclient/trpc";
import { useState } from "react";
import { useTranslation } from "next-i18next";
import Spinner from "@ui/spinner";
import { ROLE_LIST } from "../user/[userId]";
import Pagination from "@ui/pagination";
import SimpleForm from "@ui/simpleform";
import {
  type SubmitErrorHandler,
  type SubmitHandler,
  useForm,
} from "react-hook-form";
import { CgSearch } from "react-icons/cg";

type UserFilter = {
  name?: string;
  email?: string;
  role?: Role;
  dueDate?: Date;
};

const PER_PAGE = 20;

function UserManagement() {
  const { data: sessionData } = useSession();
  const [filter, setFilter] = useState<UserFilter>({});
  const [page, setPage] = useState(0);
  const userQuery = trpc.users.getAllUsers.useQuery({
    filter,
    skip: page * PER_PAGE,
    take: PER_PAGE,
  });
  const [userId, setUserId] = useState("");
  const { t } = useTranslation("admin");
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<UserFilter>();

  const onSubmit: SubmitHandler<UserFilter> = (data) => {
    const flt: UserFilter = {};
    if (data.name) flt.name = data.name;
    if (data.email) flt.email = data.email;
    if (data.role) flt.role = data.role;
    setFilter(flt);
  };

  const onError: SubmitErrorHandler<UserFilter> = (errors) => {
    console.error("errors :>> ", errors);
  };

  if (sessionData && sessionData.user?.role !== Role.ADMIN)
    return <div>{t("admin-only")}</div>;

  return (
    <div className="container mx-auto">
      <div className="mb-4 flex flex-row items-center gap-4">
        <h1>Gérer les utilisateurs</h1>
      </div>
      <div className="flex gap-4">
        {userQuery.isLoading ? (
          <Spinner />
        ) : (
          <div className="flex w-1/4 flex-col gap-4">
            <div className="collapse-arrow rounded-box collapse border border-base-300 bg-base-100">
              <input type="checkbox" />
              <div className="collapse-title text-xl font-medium">
                <span className="flex items-center gap-4">
                  Fitrer
                  <span className="badge-info badge">
                    {Object.keys(filter).length}
                  </span>
                </span>
              </div>
              <div className="collapse-content">
                <SimpleForm
                  errors={errors}
                  register={register}
                  fields={[
                    {
                      label: "Nom",
                      name: "name",
                    },
                    {
                      label: "Email",
                      name: "email",
                    },
                    {
                      label: "Role",
                      name: "role",
                      component: (
                        <select
                          className="select-bordered select w-full max-w-xs"
                          {...register("role")}
                        >
                          <option></option>
                          {ROLE_LIST.filter(
                            (rl) => rl.value !== Role.ADMIN
                          ).map((rl) => (
                            <option key={rl.value} value={rl.value}>
                              {t(`auth:${rl.label}`)}
                            </option>
                          ))}
                        </select>
                      ),
                    },
                  ]}
                />
                <button
                  onClick={handleSubmit(onSubmit, onError)}
                  className="btn btn-primary btn-block mt-2 flex gap-4"
                >
                  <CgSearch size={24} />
                  Chercher
                </button>
              </div>
            </div>
            <ul className="menu overflow-hidden rounded bg-base-100">
              {userQuery.data?.[1]?.map((user) => (
                <li key={user.id}>
                  <button
                    className={`flex w-full items-center justify-between text-center ${
                      userId === user.id ? "active" : ""
                    }`}
                    onClick={() => setUserId(user.id)}
                  >
                    <span>{user.name}</span>
                    <span className="badge-secondary badge">
                      {ROLE_LIST.find((r) => r.value === user.role)?.label ??
                        "?"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <Pagination
              actualPage={page}
              count={userQuery.data?.[0] ?? 0}
              onPageClick={(page) => setPage(page)}
              perPage={PER_PAGE}
            />
          </div>
        )}
        {userId === "" ? null : <UserContent userId={userId} />}
      </div>
    </div>
  );
}

export default UserManagement;

type UserContentProps = {
  userId: string;
};

export function UserContent({ userId }: UserContentProps) {
  const userQuery = trpc.users.getUserFullById.useQuery(userId);
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2>{userQuery.data?.name}</h2>
          <p>({userQuery.data?.email})</p>
        </div>
        <div className="flex items-center gap-2">
          {/* <UpdateClub clubId={clubId} />
          <CreateClubCalendar clubId={clubId} />
          <DeleteClub clubId={clubId} /> */}
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps = async ({
  locale,
  req,
  res,
}: GetServerSidePropsContext) => {
  const session = await unstable_getServerSession(req, res, authOptions);
  if (session?.user?.role !== Role.ADMIN)
    return {
      redirect: "/",
      permanent: false,
    };

  return {
    props: {
      ...(await serverSideTranslations(
        locale ?? "fr",
        ["common", "admin", "auth", "home"],
        nextI18nConfig
      )),
      userId: session?.user?.id || "",
    },
  };
};
