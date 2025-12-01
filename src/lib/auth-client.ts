import { adminClient, usernameClient, phoneNumberClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { toast } from "@/lib/toast";
import { getBaseUrl } from "@/lib/utils";

export const authClient = createAuthClient({
  baseURL: `${getBaseUrl()}/api/auth`,
  plugins: [usernameClient(), adminClient(), phoneNumberClient()],
  fetchOptions: {
    onError: (ctx) => {
      toast.error(ctx.error.message);
    },
  },
});
