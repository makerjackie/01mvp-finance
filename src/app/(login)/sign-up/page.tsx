import { Suspense } from "react";
import { Login } from "@/components/login";

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <Login mode="signup" />
    </Suspense>
  );
}
