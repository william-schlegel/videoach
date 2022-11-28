import type { Role } from "@prisma/client";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import { useForm, type SubmitHandler } from "react-hook-form";

export const ROLE_LIST = [
  { label: "Utilisateur", value: "USER" },
  { label: "Coach", value: "COACH" },
  { label: "Manager", value: "MANAGER" },
  { label: "Administrateur", value: "ADMIN" },
];

type FormValues = {
  name: string;
  email: string;
  role: Role;
};

export default function Profile() {
  const router = useRouter();
  const { userId } = router.query;
  const myUserId = (Array.isArray(userId) ? userId[0] : userId) || "";
  const userQuery = trpc.users.getUserById.useQuery(myUserId);
  const { register, handleSubmit } = useForm<FormValues>();
  const utils = trpc.useContext();
  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess() {
      utils.users.getUserById.invalidate(myUserId);
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) =>
    updateUser.mutate({
      id: myUserId,
      ...data,
    });

  return (
    <article className="mx-auto max-w-5xl">
      <h1>Votre profile</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset>
          <label htmlFor="name">Changer mon nom</label>
          <input
            className="input"
            {...register("name")}
            defaultValue={userQuery.data?.name || undefined}
          />
        </fieldset>
        <fieldset>
          <label htmlFor="role">Role</label>
          <select
            id="role"
            className="select-bordered select w-full max-w-xs"
            {...register("role")}
            defaultValue={userQuery.data?.role}
          >
            {ROLE_LIST.filter((rl) => rl.value !== "ADMIN").map((rl) => (
              <option key={rl.value} value={rl.value}>
                {rl.label}
              </option>
            ))}
          </select>
        </fieldset>
        <button className="btn-primary btn" disabled={updateUser.isLoading}>
          Enregistrer les informations
        </button>
      </form>
    </article>
  );
}
