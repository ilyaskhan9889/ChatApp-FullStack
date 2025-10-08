import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getAuthUser, logout } from "../lib/api.js";

const useLogout = () => {
  const queryClient = useQueryClient();
  const authUser = getAuthUser();
  if (!authUser) {
    throw new Error("useLogout must be used when user is logged in");
  }
  const {
    mutate: logoutMutation,
    isPending,
    error,
  } = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  return { logoutMutation, isPending, error };
};
export default useLogout;
