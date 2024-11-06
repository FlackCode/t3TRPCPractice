"use client"

import { useState } from "react";
import { useCurrentUser } from "~/hooks/user";
import { api } from "~/trpc/react";
import { type TRPCUser } from "~/types";

export default function Home() {
  const [formData, setFormData] = useState({
    fullName: "", email: "", password: ""
  });
  const [status, setStatus] = useState<{
    type: "error" | "success" | "loading" | null;
    message: string;
  }>({ type: null, message: "" });
  const [user, setUser] = useState<TRPCUser | null>(null);
  useCurrentUser(setUser)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser.mutate(formData);
  }

  const createUser = api.user.createUser.useMutation({
    onSuccess: () => {
      setFormData({
        fullName: "",
        email: "",
        password: ""
      })
      setStatus({ type: "success", message: "User Successfully Created!" });
    },
    onError: (error) => {
      const message = (error.data?.zodError?.fieldErrors?.password?.[0] 
        ?? error.data?.zodError?.fieldErrors?.email?.[0])
        ?? error.data?.zodError?.fieldErrors?.fullName?.[0]
        ?? error.message;
      setStatus({ type: "error", message});
    },
    onMutate: () => {
      setStatus({ type: "loading", message: "Creating user..." });
    }
  })

  return (
    <main className="w-full h-screen flex flex-col justify-center items-center bg-zinc-900">
    <form 
      onSubmit={handleSubmit} 
      className="bg-zinc-800/50 border border-gray-300 p-4 rounded-3xl flex flex-col gap-2 backdrop-blur-md max-w-md w-full mx-4"
    >
      <h1 className="text-center font-semibold text-white text-3xl">Auth Test Form</h1>
      <input 
        type="text" 
        placeholder="Full Name" 
        name="fullName" 
        value={formData.fullName} 
        onChange={handleChange}
        className="rounded-md px-2 py-1 focus:outline-none"
      />
      <input 
        type="email" 
        placeholder="Email" 
        name="email" 
        value={formData.email} 
        onChange={handleChange}
        className="rounded-md px-2 py-1 focus:outline-none"
      />
      <input 
        type="password" 
        placeholder="Password" 
        name="password" 
        value={formData.password} 
        onChange={handleChange}
        className="rounded-md px-2 py-1 focus:outline-none"
      />
      <button 
        type="submit" 
        className="bg-white font-bold rounded-md px-2 py-1 border-white duration-300 hover:bg-zinc-800 hover:border hover:text-white"
      >
        {status.type === "loading" ? "Creating..." : "Submit"}
      </button>
      {status.message && (
        <p className={`text-center text-sm break-words ${
          status.type === "error" ? "text-red-400" : 
          status.type === "success" ? "text-green-400" : 
          "text-white"
        }`}>
          {status.message}
        </p>
      )}
    </form>

    {user && (
        <div className="mt-4 p-4 bg-zinc-800/70 border border-gray-300 rounded-md max-w-md w-full mx-4">
          <h2 className="text-lg font-semibold text-white">User Information</h2>
          <p className="text-white">Full Name: <span className="font-bold">{user.fullName}</span></p>
          <p className="text-white">Email: <span className="font-bold">{user.email}</span></p>
        </div>
    )}
  </main>
  );
}
