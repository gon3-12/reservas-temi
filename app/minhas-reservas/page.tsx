
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from "qrcode.react";

type Reserva = {
  id: string;
  reservation_number: number;
  reservation_date: string;
  reservation_time: string;
  people: number;
  status: string;
  qr_token: string;
  manual_code: string | null;
  table_id: number | null;
};


export default function MinhasReservasPage() {
  const [utilizador, setUtilizador] = useState<User | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarReservas() {
      setCarregando(true);
      setErro("");

      try {
        const {
          data: { user },
          error: erroAuth,
        } = await supabase.auth.getUser();

        if (!ativo) return;

        if (erroAuth || !user) {
          setUtilizador(null);
          setReservas([]);
          return;
        }

        setUtilizador(user);

        const { data, error } = await supabase
          .from("reservations")
          .select(
            "id, reservation_number, reservation_date, reservation_time, people, status, qr_token, manual_code, table_id"
          )
          .eq("user_id", user.id)
          .order("reservation_date", { ascending: false })
          .order("reservation_time", { ascending: false });

        if (error) throw error;

        if (ativo) {
          setReservas((data ?? []) as Reserva[]);
        }
      } catch (e) {
        console.error("Erro ao carregar reservas:", e);

        if (ativo) {
          setErro(
            "Não foi possível carregar as suas reservas. Tente novamente."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    void carregarReservas();

    return () => {
      ativo = false;
    };
  }, []);

  async function copiar(texto: string, identificador: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(identificador);

      window.setTimeout(() => {
        setCopiado((atual) =>
          atual === identificador ? "" : atual
        );
      }, 2000);
    } catch {
      setErro("Não foi possível copiar. Selecione o texto manualmente.");
    }
  }

  function formatarData(data: string) {
    const [ano, mes, dia] = data.split("-").map(Number);

    return new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(ano, mes - 1, dia));
  }

  function formatarHora(hora: string) {
    return hora.slice(0, 5);
  }

  function estadoReserva(estado: string) {
    if (estado === "confirmed") {
      return {
        texto: "Confirmada",
        classes: "bg-emerald-100 text-emerald-800",
      };
    }

    if (estado === "cancelled") {
      return {
        texto: "Cancelada",
        classes: "bg-red-100 text-red-700",
      };
    }

    return {
      texto: estado,
      classes: "bg-gray-100 text-gray-700",
    };
  }

  return (
    <main className="min-h-screen bg-[#F5F8F7] px-4 py-10 text-[#173B35]">
      <div className="mx-auto max-w-5xl">
        {/* CABEÇALHO */}
        <header className="mb-9">
          <Link
            href="/"
            className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-[#177D5A] hover:underline"
          >
            ← Voltar ao início
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#177D5A]">
                TEMI RESTAURANT
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                As minhas reservas
              </h1>

              <p className="mt-3 text-base text-[#60736B]">
                Consulte os detalhes e apresente a sua reserva
                ao nosso assistente temi.
              </p>
            </div>

            <Link
              href="/reservas"
              className="rounded-2xl bg-[#173B35] px-6 py-4 text-center font-semibold text-white transition hover:bg-[#24594E]"
            >
              + Nova reserva
            </Link>
          </div>
        </header>

        {/* ERRO */}
        {erro && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
          >
            {erro}
          </div>
        )}

        {/* CARREGAMENTO */}
        {carregando && (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-4 border-[#DCEBE3] border-t-[#177D5A]" />

            <p className="text-lg font-medium">
              A carregar as suas reservas...
            </p>
          </div>
        )}

        {/* UTILIZADOR NÃO AUTENTICADO */}
        {!carregando && !utilizador && (
          <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm">
            <div className="mb-5 text-5xl">🔐</div>

            <h2 className="text-2xl font-bold">
              Inicie sessão para continuar
            </h2>

            <p className="mx-auto mt-3 max-w-md text-[#60736B]">
              Para proteger os seus dados, apenas pode consultar
              as reservas associadas à sua conta.
            </p>

            <Link
              href="/login"
              className="mt-7 inline-block rounded-xl bg-[#173B35] px-7 py-4 font-semibold text-white"
            >
              Iniciar sessão
            </Link>
          </div>
        )}

        {/* SEM RESERVAS */}
        {!carregando &&
          utilizador &&
          !erro &&
          reservas.length === 0 && (
            <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm">
              <div className="mb-5 text-5xl">📅</div>

              <h2 className="text-2xl font-bold">
                Ainda não tem reservas
              </h2>

              <p className="mt-3 text-[#60736B]">
                Faça a sua primeira reserva e venha visitar-nos!
              </p>

              <Link
                href="/reservas"
                className="mt-7 inline-block rounded-xl bg-[#173B35] px-7 py-4 font-semibold text-white"
              >
                Fazer reserva
              </Link>
            </div>
          )}

        {/* LISTA DE RESERVAS */}
        {!carregando && utilizador && (
          <div className="space-y-6">
            {reservas.map((reserva) => {
              const estado = estadoReserva(reserva.status);
              const confirmada = reserva.status === "confirmed";

              return (
                <article
                  key={reserva.id}
                  className="overflow-hidden rounded-3xl border border-[#E2EBE6] bg-white shadow-sm"
                >
                  {/* CABEÇALHO DA RESERVA */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8F0EB] px-6 py-5 sm:px-8">
                    <div>
                      <p className="text-sm text-[#60736B]">
                        Número da reserva
                      </p>

                      <h2 className="mt-1 text-2xl font-bold">
                        Nº{" "}
                        {String(reserva.reservation_number).padStart(
                          6,
                          "0"
                        )}
                      </h2>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${estado.classes}`}
                    >
                      {estado.texto}
                    </span>
                  </div>

                  {/* INFORMAÇÕES */}
                  <div className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-8">
                    <div className="rounded-2xl bg-[#F5F8F7] p-4">
                      <p className="mb-2 text-sm text-[#60736B]">
                        📅 Data
                      </p>

                      <p className="font-semibold">
                        {formatarData(reserva.reservation_date)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F5F8F7] p-4">
                      <p className="mb-2 text-sm text-[#60736B]">
                        🕒 Hora
                      </p>

                      <p className="font-semibold">
                        {formatarHora(reserva.reservation_time)}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-[#F5F8F7] p-4">
                      <p className="mb-2 text-sm text-[#60736B]">
                        👥 Pessoas
                      </p>

                      <p className="font-semibold">
                        {reserva.people}{" "}
                        {reserva.people === 1
                          ? "pessoa"
                          : "pessoas"}
                      </p>
                    </div>
                  </div>

                  {/* IDENTIFICAÇÃO NO TEMI */}
                  {confirmada && (
                    <div className="px-6 pb-8 sm:px-8">
                      <div className="rounded-3xl border border-[#D8E8DE] bg-[#F3FAF5] p-5 sm:p-7">
                        <div className="mb-6 text-center">
                          <h3 className="text-xl font-bold">
                            Apresente a sua reserva ao temi
                          </h3>

                          <p className="mt-2 text-sm text-[#60736B]">
                            Pode utilizar o QR Code ou introduzir
                            os dados manualmente.
                          </p>
                        </div>

                        {/* QR CODE */}
                        <div className="mx-auto flex max-w-sm flex-col items-center rounded-2xl bg-white p-6 shadow-sm">
                          <div className="rounded-xl border border-[#E4ECE6] bg-white p-3">
                            <QRCodeSVG
                              value={`TEMI-RESERVA:${reserva.qr_token}`}
                              size={210}
                              level="H"
                              bgColor="#FFFFFF"
                              fgColor="#173B35"
                              marginSize={1}
                            />
                          </div>

                          <p className="mt-4 text-center text-sm font-medium">
                            Mostre este código à câmara do robô.
                          </p>
                        </div>

                        {/* SEPARADOR */}
                        <div className="my-7 flex items-center gap-4">
                          <div className="h-px flex-1 bg-[#D6E5DA]" />

                          <span className="text-sm font-semibold text-[#60736B]">
                            OU
                          </span>

                          <div className="h-px flex-1 bg-[#D6E5DA]" />
                        </div>

                        {/* CONFIRMAÇÃO MANUAL */}
                        <div className="rounded-2xl border border-[#D6E5DA] bg-white p-5 sm:p-6">
                          <div className="mb-5">
                            <h4 className="text-lg font-bold">
                              Não consegue ler o QR Code?
                            </h4>

                            <p className="mt-2 text-sm text-[#60736B]">
                              No temi, escolha a opção
                              {" "}
                              <strong>
                                Introduzir número da reserva
                              </strong>
                              {" "}
                              e utilize os dados abaixo.
                            </p>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            {/* NÚMERO */}
                            <div className="rounded-xl bg-[#F5F8F7] p-4">
                              <p className="text-xs font-medium text-[#60736B]">
                                Número da reserva
                              </p>

                              <p className="mt-2 text-2xl font-bold tracking-wide">
                                {String(
                                  reserva.reservation_number
                                ).padStart(6, "0")}
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  copiar(
                                    String(
                                      reserva.reservation_number
                                    ),
                                    `numero-${reserva.id}`
                                  )
                                }
                                className="mt-3 text-sm font-semibold text-[#177D5A] hover:underline"
                              >
                                {copiado === `numero-${reserva.id}`
                                  ? "✓ Copiado"
                                  : "Copiar número"}
                              </button>
                            </div>

                            {/* CÓDIGO MANUAL */}
                            <div className="rounded-xl bg-[#F5F8F7] p-4">
                              <p className="text-xs font-medium text-[#60736B]">
                                Código de confirmação
                              </p>

                              {reserva.manual_code ? (
                                <>
                                  <p className="mt-2 break-all font-mono text-xl font-bold tracking-wider sm:text-2xl">
                                    {reserva.manual_code}
                                  </p>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      copiar(
                                        reserva.manual_code!,
                                        `codigo-${reserva.id}`
                                      )
                                    }
                                    className="mt-3 text-sm font-semibold text-[#177D5A] hover:underline"
                                  >
                                    {copiado === `codigo-${reserva.id}`
                                      ? "✓ Copiado"
                                      : "Copiar código"}
                                  </button>
                                </>
                              ) : (
                                <p className="mt-2 text-sm text-red-700">
                                  Código ainda não disponível.
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="mt-5 text-xs leading-relaxed text-[#60736B]">
                            🔒 Este código é privado. Não o partilhe
                            com outras pessoas, pois permite confirmar
                            a sua reserva no restaurante.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* RESERVA CANCELADA */}
                  {!confirmada && (
                    <div className="px-6 pb-7 sm:px-8">
                      <div className="rounded-2xl bg-[#F5F8F7] p-5 text-sm text-[#60736B]">
                        Esta reserva não está ativa e não pode
                        ser utilizada para entrar no restaurante.
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* RODAPÉ */}
        <footer className="mt-12 text-center text-sm text-[#60736B]">
          TEMI RESTAURANT · Sistema de reservas inteligente
        </footer>
      </div>
    </main>
  );
}
