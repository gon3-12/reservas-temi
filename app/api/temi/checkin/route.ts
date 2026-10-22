
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

function chaveValida(recebida: string | null) {
  const esperada = process.env.TEMI_DEVICE_KEY;

  if (!recebida || !esperada) return false;

  const a = Buffer.from(recebida);
  const b = Buffer.from(esperada);

  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  try {
    if (!chaveValida(request.headers.get("x-temi-key"))) {
      return NextResponse.json(
        { error: "Acesso não autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const qrToken = body?.qr_token;

    if (
      typeof qrToken !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        qrToken
      )
    ) {
      return NextResponse.json(
        { error: "Código QR inválido" },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: "Configuração do servidor incompleta" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.rpc("temi_checkin", {
      p_qr_token: qrToken,
    });

    if (error) {
      const mensagens: Record<string, string> = {
        RESERVA_NAO_ENCONTRADA: "Reserva não encontrada.",
        RESERVA_CANCELADA: "Esta reserva está cancelada.",
        RESERVA_FORA_DA_DATA:
          "Esta reserva não corresponde à data de hoje.",
        SEM_MESAS_DISPONIVEIS:
          "Não existem mesas disponíveis neste momento.",
      };

      const mensagem = Object.entries(mensagens).find(
        ([codigo]) => error.message.includes(codigo)
      );

      if (mensagem) {
        return NextResponse.json(
          { error: mensagem[1] },
          { status: 409 }
        );
      }

      console.error("Erro de check-in:", error);

      return NextResponse.json(
        { error: "Não foi possível validar a reserva." },
        { status: 500 }
      );
    }

    const reserva = data?.[0];

    if (!reserva) {
      return NextResponse.json(
        { error: "Não foi possível atribuir uma mesa." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reservation_number: reserva.reservation_number,
      table_number: reserva.table_number,
      people: reserva.people,
    });
  } catch (error) {
    console.error("Erro na API do temi:", error);

    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 }
    );
  }
}
