import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const refunds = await prisma.refundRequest.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
        order: {
          include: {
            items: true,
          },
        },
        auditLogs: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json({
      refunds,
      total: refunds.length,
    });
  } catch (error) {
    console.error("Admin refunds error:", error);

    return NextResponse.json(
      { error: "Unable to load refund requests." },
      { status: 500 }
    );
  }
}