import { Suspense } from "react";
import { Login } from "@/components/login";

export default function SignInPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <Login />
    </Suspense>
  );
}
