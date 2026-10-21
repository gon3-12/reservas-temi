
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type Reserva = {
  id: string;
  reservation_number: number;
  reservation_date: string;
  reservation_time: string;
  people: number;
  status: "confirmed" | "cancelled";
  qr_token: string;
};

export default function MinhasReservas() {
  const [utilizador, setUtilizador] = useState<User | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [aCancelar, setACancelar] = useState<string | null>(null);

  const carregarReservas = useCallback(async (userId: string) => {
    setErro("");

    const { data, error } = await supabase
      .from("reservations")
      .select(
        "id, reservation_number, reservation_date, reservation_time, people, status, qr_token"
      )
      .eq("user_id", userId)
      .order("reservation_date", { ascending: false })
      .order("reservation_time", { ascending: false });

    if (error) {
      console.error(error);
      setErro("Não foi possível carregar as reservas.");
      return;
    }

    setReservas((data ?? []) as Reserva[]);
  }, []);

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      const { data, error } = await supabase.auth.getUser();

      if (!ativo) return;

      if (error || !data.user) {
        window.location.href = "/login";
        return;
      }

      setUtilizador(data.user);
      await carregarReservas(data.user.id);

      if (ativo) setLoading(false);
    }

    iniciar();

    return () => {
      ativo = false;
    };
  }, [carregarReservas]);

  async function cancelarReserva(reserva: Reserva) {
    if (!utilizador || reserva.status === "cancelled") return;

    const confirmar = window.confirm(
      `Queres cancelar a reserva #${reserva.reservation_number}?`
    );

    if (!confirmar) return;

    setACancelar(reserva.id);
    setErro("");

    const { data, error } = await supabase
      .from("reservations")
      .update({ status: "cancelled" })
      .eq("id", reserva.id)
      .eq("user_id", utilizador.id)
      .eq("status", "confirmed")
      .select("id");

    if (error) {
      setErro("Não foi possível cancelar a reserva.");
      console.error(error);
    } else if (!data || data.length === 0) {
      setErro("A reserva já não está disponível para cancelamento.");
    }

    await carregarReservas(utilizador.id);
    setACancelar(null);
  }

  function formatarData(data: string) {
    const [ano, mes, dia] = data.split("-").map(Number);

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(ano, mes - 1, dia));
  }

  function formatarNumero(numero: number) {
    return String(numero).padStart(6, "0");
  }

  return (
    <main className="min-h-screen bg-[#F7F8F5] text-[#173B35]">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
        <Link href="/" className="text-xl font-bold">
          Temi<span className="text-emerald-600">Reservations</span>
        </Link>

        <Link
          href="/"
          className="rounded-full bg-[#173B35] px-5 py-2.5 text-sm font-semibold text-white"
        >
          ← Página inicial
        </Link>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
          Área pessoal
        </p>

        <h1 className="mt-3 text-4xl font-bold">
          As minhas reservas
        </h1>

        <p className="mt-3 text-slate-500">
          Consulta os teus códigos QR e gere as tuas reservas.
        </p>

        {loading ? (
          <div className="mt-10 rounded-2xl bg-white p-8 text-center">
            A carregar reservas...
          </div>
        ) : (
          <>
            {erro && (
              <p
                role="alert"
                className="mt-6 rounded-xl bg-red-50 p-4 text-red-700"
              >
                {erro}
              </p>
            )}

            {reservas.length === 0 ? (
              <div className="mt-10 rounded-3xl bg-white p-12 text-center shadow-sm">
                <h2 className="text-2xl font-bold">
                  Ainda não tens reservas
                </h2>

                <p className="mt-3 text-slate-500">
                  Faz a tua primeira reserva para receberes o código QR.
                </p>

                <Link
                  href="/#reservar"
                  className="mt-6 inline-block rounded-full bg-[#173B35] px-6 py-3 font-semibold text-white"
                >
                  Fazer reserva
                </Link>
              </div>
            ) : (
              <div className="mt-10 space-y-6">
                {reservas.map((reserva) => (
                  <article
                    key={reserva.id}
                    className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-500">
                          Código da reserva
                        </p>

                        <h2 className="mt-1 text-3xl font-bold">
                          #{formatarNumero(reserva.reservation_number)}
                        </h2>
                      </div>

                      <span
                        className={`rounded-full px-4 py-2 text-sm font-semibold ${
                          reserva.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {reserva.status === "confirmed"
                          ? "Confirmada"
                          : "Cancelada"}
                      </span>
                    </div>

                    <div className="mt-7 grid gap-6 border-t border-slate-100 pt-6 md:grid-cols-2">
                      {/* DETALHES */}
                      <div className="space-y-5">
                        <div>
                          <p className="text-sm text-slate-500">
                            📅 Data
                          </p>
                          <p className="mt-1 font-semibold">
                            {formatarData(reserva.reservation_date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500">
                            🕒 Hora
                          </p>
                          <p className="mt-1 font-semibold">
                            {reserva.reservation_time.slice(0, 5)}
                          </p>
                        </div>

                        <div>
                          <p className="text-sm text-slate-500">
                            👥 Número de pessoas
                          </p>
                          <p className="mt-1 font-semibold">
                            {reserva.people}
                          </p>
                        </div>

                        {reserva.status === "confirmed" && (
                          <button
                            type="button"
                            disabled={aCancelar === reserva.id}
                            onClick={() => cancelarReserva(reserva)}
                            className="rounded-xl border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {aCancelar === reserva.id
                              ? "A cancelar..."
                              : "Cancelar reserva"}
                          </button>
                        )}
                      </div>

                      {/* CÓDIGO QR */}
                      <div className="flex flex-col items-center justify-center rounded-2xl bg-[#F7F8F5] p-6">
                        {reserva.status === "confirmed" ? (
                          <>
                            <div className="rounded-xl bg-white p-4 shadow-sm">
                              <QRCodeSVG
                                value={`TEMI-RESERVA:${reserva.qr_token}`}
                                size={190}
                                level="H"
                                marginSize={0}
                                bgColor="#FFFFFF"
                                fgColor="#173B35"
                              />
                            </div>

                            <p className="mt-4 text-center text-sm font-semibold">
                              Código QR da reserva
                            </p>

                            <p className="mt-2 max-w-xs text-center text-xs text-slate-500">
                              Apresenta este código ao robô temi
                              quando chegares.
                            </p>
                          </>
                        ) : (
                          <div className="text-center">
                            <p className="text-4xl">🚫</p>

                            <p className="mt-3 font-semibold text-red-600">
                              QR Code indisponível
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                              Esta reserva foi cancelada.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
