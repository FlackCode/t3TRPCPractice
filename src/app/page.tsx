import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const testing = await api.testing.testing({text: "Hello"});

  return (
    <HydrateClient>
     <main className="w-full h-screen flex justify-center items-center bg-zinc-900">
        <div className="bg-zinc-800/50 border border-gray-300 p-4 rounded-3xl flex flex-col gap-2 backdrop-blur-md">
          <h1 className="text-center font-semibold text-white text-3xl">Auth Test Form</h1>
          <input type="text" placeholder="Full Name" className="rounded-md px-2 py-1 focus:outline-none"/>
          <input type="email" placeholder="Email" className="rounded-md px-2 py-1 focus:outline-none"/>
          <input type="password" placeholder="Password" className="rounded-md px-2 py-1 focus:outline-none"/>
          <button type="submit" 
          className="bg-white font-bold rounded-md px-2 py-1 border-white duration-300 hover:bg-zinc-800 hover:border hover:text-white">Submit</button>
        </div>
     </main>
    </HydrateClient>
  );
}
