import { useEffect } from "react";
import { api } from "~/trpc/react";
import { type tRPCUser } from "~/types";

export const useCurrentUser = (setUser: (user: tRPCUser | null) => void) => {
    const { data, error, isLoading } = api.user.currentUser.useQuery();

    useEffect(() => {
        if (isLoading) {
            console.log("Loading current user...");
            return; // Early return if loading
        }

        if (error) {
            console.error("Error fetching current user:", error);
            setUser(null); // Handle error case
            return;
        }

        if (data) {
            console.log("Fetched User Data:", data);
            setUser(data);
        } else {
            console.log("No user data found.");
            setUser(null); // No user data case
        }
    }, [data, error, isLoading, setUser]);
};