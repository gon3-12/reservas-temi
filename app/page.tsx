
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function Home() {
  const [utilizador, setUtilizador] = useState<User | null>(null);
  const [aVerificarLogin, setAVerificarLogin] = useState(true);

  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [pessoas, setPessoas] = useState("2");

  useEffect(() => {
    let ativo = true;

    async function verificarLogin() {
      const { data: resposta } = await supabase.auth.getUser();

      if (ativo) {
        setUtilizador(resposta.user);
        setAVerificarLogin(false);
      }
    }

    verificarLogin();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_evento, sessao) => {
        if (ativo) {
          setUtilizador(sessao?.user ?? null);
          setAVerificarLogin(false);
        }
      }
    );

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function terminarSessao() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Não foi possível terminar sessão.");
      return;
    }

    setUtilizador(null);
    window.location.href = "/";
  }

  
  async function confirmarReserva(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Verificar a sessão diretamente no Supabase
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      alert("Precisas de iniciar sessão para fazer uma reserva.");
      window.location.href = "/login";
      return;
    }

    // Validar os dados
    if (!data || !hora || !pessoas) {
      alert("Preenche todos os campos.");
      return;
    }

    const dataHoraReserva = new Date(`${data}T${hora}:00`);

    if (
      Number.isNaN(dataHoraReserva.getTime()) ||
      dataHoraReserva <= new Date()
    ) {
      alert("Escolhe uma data e hora futuras.");
      return;
    }

    const numeroPessoas = Number(pessoas);

    if (
      !Number.isInteger(numeroPessoas) ||
      numeroPessoas < 1 ||
      numeroPessoas > 12
    ) {
      alert("O número de pessoas deve estar entre 1 e 12.");
      return;
    }

    // Guardar a reserva no Supabase
    const { data: reservaCriada, error } = await supabase
      .from("reservations")
      .insert({
        user_id: authData.user.id,
        reservation_date: data,
        reservation_time: hora,
        people: numeroPessoas,
      })
      .select("reservation_number")
      .single();

    if (error) {
      console.error("Erro ao criar reserva:", error);
      alert("Não foi possível guardar a reserva: " + error.message);
      return;
    }

    alert(
      `Reserva confirmada com sucesso!\n\n` +
      `Número: ${reservaCriada.reservation_number}\n` +
      `Data: ${data}\n` +
      `Hora: ${hora}\n` +
      `Pessoas: ${pessoas}`
    );

    // Limpar o formulário
    setData("");
    setHora("");
    setPessoas("2");
  }


  const nome =
    utilizador?.user_metadata?.nome ||
    utilizador?.email?.split("@")[0] ||
    "Utilizador";

  return (
    <main className="min-h-screen bg-[#F7F8F5] text-[#173B35]">

      {/* CABEÇALHO */}
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">

        <Link href="/" className="text-xl font-bold tracking-tight">
          Temi<span className="text-emerald-600">Reservations</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-4 text-sm">

          <a href="#reservar" className="hover:text-emerald-600">
            Reservar
          </a>

          {aVerificarLogin ? (
            <span className="text-slate-400">
              A verificar sessão...
            </span>
          ) : utilizador ? (
            <>
              <span className="font-medium">
                Olá, {nome}!
              </span>

              <Link
                href="/minhas-reservas"
                className="hover:text-emerald-600"
              >
                As minhas reservas
              </Link>

              <button
                type="button"
                onClick={terminarSessao}
                className="rounded-full bg-[#173B35] px-5 py-2.5 text-white transition hover:bg-[#28594F]"
              >
                Terminar sessão
              </button>
            </>
          ) : (
            <>
              <Link
                href="/registo"
                className="hover:text-emerald-600"
              >
                Criar conta
              </Link>

              <Link
                href="/login"
                className="rounded-full bg-[#173B35] px-5 py-2.5 text-white transition hover:bg-[#28594F]"
              >
                Entrar
              </Link>
            </>
          )}

        </nav>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">

        <div>
          <span className="rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Reservas inteligentes
          </span>

          <h1 className="mt-7 text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            A tua próxima experiência começa aqui.
          </h1>

          <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-600">
            Reserva em poucos segundos, acompanha as tuas reservas
            e recebe um código QR para apresentar ao nosso robô temi.
          </p>

          <a
            href="#reservar"
            className="mt-8 inline-block rounded-full bg-[#173B35] px-7 py-4 font-semibold text-white transition hover:bg-[#28594F]"
          >
            Fazer reserva →
          </a>

          <div className="mt-10 grid max-w-md grid-cols-3 gap-4">

            <div>
              <p className="text-2xl font-bold">01</p>
              <p className="mt-1 text-xs text-slate-500">
                Escolhe o dia
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold">02</p>
              <p className="mt-1 text-xs text-slate-500">
                Faz a reserva
              </p>
            </div>

            <div>
              <p className="text-2xl font-bold">03</p>
              <p className="mt-1 text-xs text-slate-500">
                Apresenta o QR
              </p>
            </div>

          </div>
        </div>

        {/* FORMULÁRIO DE RESERVA */}
        <div
          id="reservar"
          className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-950/5"
        >
          <div className="mb-8">

            <p className="text-sm font-medium text-emerald-700">
              SIMPLES E RÁPIDO
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Faz a tua reserva
            </h2>

            <p className="mt-2 text-slate-500">
              Escolhe os detalhes da tua visita.
            </p>

          </div>

          <form onSubmit={confirmarReserva} className="space-y-5">

            <div>
              <label
                htmlFor="data"
                className="mb-2 block text-sm font-semibold"
              >
                Data da reserva
              </label>

              <input
                id="data"
                type="date"
                required
                value={data}
                min={new Date().toLocaleDateString("en-CA")}
                onChange={(e) => setData(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label
                htmlFor="hora"
                className="mb-2 block text-sm font-semibold"
              >
                Hora
              </label>

              <input
                id="hora"
                type="time"
                required
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label
                htmlFor="pessoas"
                className="mb-2 block text-sm font-semibold"
              >
                Número de pessoas
              </label>

              <select
                id="pessoas"
                value={pessoas}
                onChange={(e) => setPessoas(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 outline-none focus:border-emerald-600"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(
                  (numero) => (
                    <option key={numero} value={numero}>
                      {numero} {numero === 1 ? "pessoa" : "pessoas"}
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="submit"
              disabled={aVerificarLogin}
              className="w-full rounded-xl bg-[#173B35] px-6 py-4 font-semibold text-white transition hover:bg-[#28594F] disabled:opacity-50"
            >
              Confirmar reserva →
            </button>

            <p className="text-center text-xs text-slate-400">
              Em breve: confirmação e código QR da reserva.
            </p>

          </form>
        </div>

      </section>

      {/* RODAPÉ */}
      <footer className="border-t border-slate-200 px-6 py-6 text-center text-sm text-slate-500">
        © 2026 Temi Reservations · Sistema inteligente de reservas
      </footer>

    </main>
  );
}
