import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const phone = searchParams.get("phone");

  if (!phone) {
    return NextResponse.json({ error: "缺少手机号参数" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        phoneNumber: phone,
      },
    });

    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error("检查手机号失败", error);
    return NextResponse.json({ error: "检查失败" }, { status: 500 });
  }
}
