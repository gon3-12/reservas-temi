
"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Registo() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  
    async function criarConta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMensagem("");

    try {
        const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { nome },
        },
        });

        if (error) {
        setMensagem("Erro: " + error.message);
        return;
        }

        if (data.session) {
        window.location.href = "/";
        } else {
        setMensagem("Conta criada. Já podes iniciar sessão.");
        }
    } catch {
        setMensagem("Ocorreu um erro ao criar a conta.");
    } finally {
        setLoading(false);
    }
    }


  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F8F5] px-6 py-10">

      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-emerald-950/5">

        <Link href="/" className="text-xl font-bold text-[#173B35]">
          Temi<span className="text-emerald-600">Reservations</span>
        </Link>

        <h1 className="mt-10 text-3xl font-bold text-[#173B35]">
          Criar conta
        </h1>

        <p className="mt-2 text-slate-500">
          Regista-te para gerir as tuas reservas.
        </p>

        <form onSubmit={criarConta} className="mt-8 space-y-5">

          <div>
            <label htmlFor="nome" className="mb-2 block text-sm font-medium">
              Nome
            </label>

            <input
              id="nome"
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-4"
              placeholder="O teu nome"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-4"
              placeholder="exemplo@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
            >
              Palavra-passe
            </label>

            <input
              id="password"
              type="password"
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-4"
              placeholder="Mínimo de 6 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#173B35] p-4 font-semibold text-white hover:bg-[#28594F] disabled:opacity-50"
          >
            {loading ? "A criar conta..." : "Criar conta"}
          </button>

        </form>

        {mensagem && (
          <p role="status" className="mt-5 text-sm text-emerald-700">
            {mensagem}
          </p>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          Já tens conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700"
          >
            Iniciar sessão
          </Link>
        </p>

      </div>
    </main>
  );
}
