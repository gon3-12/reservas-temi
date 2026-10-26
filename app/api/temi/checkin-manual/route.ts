
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

function chaveValida(recebida: string | null): boolean {
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
        { error: "Dispositivo não autorizado." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const numero = body.reservation_number;
    const codigo = body.manual_code;

    if (
      !Number.isSafeInteger(numero) ||
      numero <= 0 ||
      typeof codigo !== "string" ||
      !/^[A-Fa-f0-9]{12}$/.test(codigo.trim())
    ) {
      return NextResponse.json(
        { error: "Número ou código de confirmação inválido." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Configuração Supabase em falta");

      return NextResponse.json(
        { error: "Serviço temporariamente indisponível." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data, error } = await supabase.rpc(
      "temi_checkin_manual",
      {
        p_reservation_number: numero,
        p_manual_code: codigo.trim().toUpperCase(),
      }
    );

    if (error) {
      console.error("Erro na confirmação manual:", error.code);

      let mensagem = "Não foi possível confirmar a reserva.";

      if (error.message.includes("INVALID_RESERVATION")) {
        mensagem = "Número ou código de confirmação incorreto.";
      } else if (
        error.message.includes("RESERVATION_WRONG_DATE")
      ) {
        mensagem = "Esta reserva não é para hoje.";
      } else if (
        error.message.includes("RESERVATION_NOT_CONFIRMED")
      ) {
        mensagem = "Esta reserva não está confirmada.";
      } else if (
        error.message.includes("NO_AVAILABLE_TABLE")
      ) {
        mensagem = "Não existem mesas disponíveis neste momento.";
      }

      return NextResponse.json(
        { error: mensagem },
        { status: 400 }
      );
    }

    const resultado = Array.isArray(data) ? data[0] : data;

    if (!resultado) {
      return NextResponse.json(
        { error: "Não foi possível atribuir uma mesa." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reservation_number: resultado.reservation_number,
      table_number: resultado.table_number,
      people: resultado.people,
    });
  } catch (error) {
    console.error("Erro inesperado na API manual:", error);

    return NextResponse.json(
      { error: "Erro ao processar a reserva." },
      { status: 500 }
    );
  }
}
