
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  async function iniciarSessao(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMensagem("");

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMensagem(
          "Não foi possível iniciar sessão. Verifica o email e a palavra-passe."
        );
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setMensagem("Ocorreu um erro ao iniciar sessão.");
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
          Bem-vindo de volta
        </h1>

        <p className="mt-2 text-slate-500">
          Inicia sessão para gerir as tuas reservas.
        </p>

        <form onSubmit={iniciarSessao} className="mt-8 space-y-5">

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
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-4"
              placeholder="A tua palavra-passe"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#173B35] p-4 font-semibold text-white hover:bg-[#28594F] disabled:opacity-50"
          >
            {loading ? "A entrar..." : "Iniciar sessão"}
          </button>

        </form>

        {mensagem && (
          <p role="alert" className="mt-5 text-sm text-red-600">
            {mensagem}
          </p>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          Ainda não tens conta?{" "}
          <Link
            href="/registo"
            className="font-semibold text-emerald-700"
          >
            Criar conta
          </Link>
        </p>

      </div>
    </main>
  );
}
