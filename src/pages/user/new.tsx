import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { trpc } from "../../utils/trpc";
import { ROLE_LIST } from "./[userId]";

type FormValues = {
  name: string;
  email: string;
  role: Role;
};
function NewUser() {
  const { data: sessionData } = useSession();
  const { register, handleSubmit, getValues } = useForm<FormValues>();
  const updateUser = trpc.users.updateUser.useMutation();
  const onSubmit: SubmitHandler<FormValues> = (data) =>
    updateUser.mutate({ id: sessionData?.user?.id || "", ...data });

  return (
    <div className="container mx-auto p-8">
      <h1>Bienvenue {sessionData?.user?.name}</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset>
          <label htmlFor="name">Changer mon nom</label>
          <input className="input" {...register("name")} />
        </fieldset>
        <fieldset>
          <label htmlFor="role">Role</label>
          <select
            id="role"
            className="select-bordered select w-full max-w-xs"
            {...register("role")}
            value={getValues("role")}
          >
            {ROLE_LIST.filter((rl) => rl.value !== Role.ADMIN).map((rl) => (
              <option key={rl.value} value={rl.value}>
                {rl.label}
              </option>
            ))}
          </select>
        </fieldset>
        <button className="btn-primary btn">
          Enregistrer les informations
        </button>
      </form>
    </div>
  );
}

export default NewUser;
