import { useEffect } from "react";
import { api } from "~/trpc/react";
import { type TRPCUser } from "~/types";

export const useCurrentUser = (setUser: (user: TRPCUser | null) => void) => {
    const { data, error, isLoading } = api.user.currentUser.useQuery(undefined, {
        retry: false,
        refetchOnWindowFocus: false,
    });

    useEffect(() => {
        if (isLoading) {
            console.log("Loading current user...");
            return;
        }

        if (error) {
            console.error("Error fetching current user:", error);
            setUser(null);
            return;
        }

        if (data) {
            console.log("Fetched User Data:", data);
            setUser(data);
        } else {
            console.log("No user data found.");
            setUser(null);
        }
    }, [data, error, isLoading, setUser]);
};