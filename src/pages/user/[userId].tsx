import { Role } from "@prisma/client";
import { useRouter } from "next/router";
import { trpc } from "../../utils/trpc";
import { useForm, type SubmitHandler } from "react-hook-form";
import SimpleForm from "../../components/ui/simpleform";

export const ROLE_LIST = [
  { label: "Utilisateur", value: Role.USER },
  { label: "Coach", value: Role.COACH },
  { label: "Manager", value: Role.MANAGER },
  { label: "Manager & Coach", value: Role.MANAGER_COACH },
  { label: "Administrateur", value: Role.ADMIN },
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
  const userQuery = trpc.users.getUserById.useQuery(myUserId, {
    onSuccess: (data) => {
      setValue("name", data?.name || "");
      setValue("email", data?.email || "");
      setValue("role", data?.role || Role.USER);
    },
  });
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>();
  const utils = trpc.useContext();
  const updateUser = trpc.users.updateUser.useMutation({
    onSuccess() {
      utils.users.getUserById.invalidate(myUserId);
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) =>
    updateUser.mutate({
      id: myUserId,
      ...userQuery.data,
      ...data,
    });

  return (
    <article className="mx-auto max-w-5xl">
      <h1>Votre profile</h1>
      <SimpleForm
        register={register}
        errors={errors}
        onSubmit={handleSubmit(onSubmit)}
        fields={[
          {
            label: "Changer mon nom",
            name: "name",
            required: "Le nom est obligatoire",
            defaultValue: userQuery.data?.name || undefined,
          },
          {
            label: "Mon email",
            name: "email",
            required: "L'email est obligatoire",
            defaultValue: userQuery.data?.email || undefined,
            type: "email",
            disabled: true,
          },
          {
            label: "Mon rôle",
            name: "role",
            component: (
              <select
                className="select-bordered select w-full max-w-xs"
                {...register("role")}
                defaultValue={userQuery.data?.role}
              >
                {ROLE_LIST.filter((rl) => rl.value !== Role.ADMIN).map((rl) => (
                  <option key={rl.value} value={rl.value}>
                    {rl.label}
                  </option>
                ))}
              </select>
            ),
          },
        ]}
      >
        <button className="btn-primary btn" disabled={updateUser.isLoading}>
          Enregistrer les informations
        </button>
      </SimpleForm>
    </article>
  );
}
