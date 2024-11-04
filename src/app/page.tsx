import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const testing = await api.testing.testing({text: "Hello"});

  return (
    <HydrateClient>
     <div>
      <h1>Hello World!!!</h1>
      <p>{testing.test}</p>
     </div>
    </HydrateClient>
  );
}
