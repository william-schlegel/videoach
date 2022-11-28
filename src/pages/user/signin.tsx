import { getProviders, signIn } from "next-auth/react";
import type { InferGetServerSidePropsType } from "next";

export default function SignIn({
  providers,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <div className="grid h-full place-items-center">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Se connecter</h2>
          {providers
            ? Object.values(providers).map((provider) => (
                <div className="btn-outline btn" key={provider.name}>
                  <button onClick={() => signIn(provider.id)}>
                    Se connecter avec votre compte {provider.name}
                  </button>
                </div>
              ))
            : null}
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
