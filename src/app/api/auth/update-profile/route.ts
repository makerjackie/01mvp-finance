import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/lib/db";
import { auth } from "@/server/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "姓名不能为空" }, { status: 400 });
    }

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("更新用户信息失败", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
