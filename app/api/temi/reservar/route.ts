
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";



function chaveValida(recebida: string, esperada: string) {
  if (!recebida || !esperada) return false;

  const a = Buffer.from(recebida);
  const b = Buffer.from(esperada);

  return a.length === b.length && timingSafeEqual(a, b);
}

function dataHoraLisboa() {
  const partes = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Lisbon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const valor = (tipo: string) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";

  return {
    data: `${valor("year")}-${valor("month")}-${valor("day")}`,
    hora: `${valor("hour")}:${valor("minute")}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const chave = process.env.TEMI_DEVICE_KEY ?? "";

    if (!chaveValida(request.headers.get("x-temi-key") ?? "", chave)) {
      return NextResponse.json(
        { success: false, error: "Dispositivo não autorizado." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error("Faltam variáveis do Supabase no servidor.");
      return NextResponse.json(
        { success: false, error: "Servidor não configurado." },
        { status: 500 }
      );
    }

    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const data =
      typeof body.reservation_date === "string"
        ? body.reservation_date
        : "";

    const hora =
      typeof body.reservation_time === "string"
        ? body.reservation_time
        : "";

    const pessoas = body.people;

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { success: false, error: "Email inválido." },
        { status: 400 }
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(data) ||
      !/^\d{2}:\d{2}$/.test(hora) ||
      !Number.isInteger(pessoas) ||
      pessoas < 1 ||
      pessoas > 12
    ) {
      return NextResponse.json(
        { success: false, error: "Dados da reserva inválidos." },
        { status: 400 }
      );
    }

    const [ano, mes, dia] = data.split("-").map(Number);
    const [horas, minutos] = hora.split(":").map(Number);

    const dataTeste = new Date(Date.UTC(ano, mes - 1, dia));

    if (
      dataTeste.getUTCFullYear() !== ano ||
      dataTeste.getUTCMonth() !== mes - 1 ||
      dataTeste.getUTCDate() !== dia ||
      horas > 23 ||
      minutos > 59
    ) {
      return NextResponse.json(
        { success: false, error: "Data ou hora inválida." },
        { status: 400 }
      );
    }

    const agora = dataHoraLisboa();

    if (
      data < agora.data ||
      (data === agora.data && hora <= agora.hora)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Escolha uma data e hora futuras.",
        },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const codigoManual = randomBytes(6)
      .toString("hex")
      .toUpperCase();

    const { data: reserva, error } = await supabase
      .from("reservations")
      .insert({
        user_id: null,
        customer_email: email,
        reservation_date: data,
        reservation_time: hora,
        people: pessoas,
        status: "confirmed",
        qr_token: randomUUID(),
        manual_code: codigoManual,
      })
      .select("reservation_number, manual_code")
      .single();

    if (error) {
      console.error("Erro ao criar reserva do temi:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Não foi possível guardar a reserva.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reservation_number: reserva.reservation_number,
        manual_code: reserva.manual_code,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro na API de reservas:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Não foi possível processar a reserva.",
      },
      { status: 500 }
    );
  }
}
