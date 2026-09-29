import { NextResponse } from "next/server";
import { z } from "zod";
import { createRefundRequest } from "@/services/refund-service";

const refundRequestSchema = z.object({
  customerEmail: z.string().email(),
  orderNumber: z.string().min(1),
  amount: z.number().positive(),
  reason: z.string().min(5).max(2000),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsed = refundRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid refund request.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await createRefundRequest(parsed.data);

    return NextResponse.json(result, {
      status: 201,
    });
  } catch (error) {
    console.error("Refund request error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to process refund request.";

    if (
      message === "Customer not found." ||
      message === "Order not found." ||
      message === "The order does not belong to this customer."
    ) {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: "Unable to process refund request.",
      },
      { status: 500 }
    );
  }
}