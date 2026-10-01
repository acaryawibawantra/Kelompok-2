"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useMe, useRegister } from "@/lib/queries";
import { registerSchema } from "@/lib/schemas";
import { isApiError } from "@/lib/api";
import { zodFieldErrors } from "@/lib/forms";

export function RegisterForm() {
  const { data: user, isLoading } = useMe();
  const register = useRegister();
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && user) router.replace("/");
  }, [isLoading, user, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = registerSchema.safeParse({ name, email, password });
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    try {
      await register.mutateAsync(parsed.data);
      toast({ title: "Akun berhasil dibuat", description: "Selamat bergabung!", tone: "success" });
      router.replace("/");
    } catch (error) {
      if (isApiError(error)) {
        setErrors(error.fields ?? {});
        toast({ title: "Gagal mendaftar", description: error.message, tone: "error" });
      } else {
        toast({ title: "Terjadi kesalahan tak terduga", tone: "error" });
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-title text-5xl leading-none text-foreground">Daftar</h1>
        <p className="text-sm text-muted">Buat akun untuk menyimpan progres lintas device.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Nama" htmlFor="name" required error={errors.name}>
          <Input
            id="name"
            name="name"
            autoComplete="name"
            placeholder="Nama lengkap"
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-invalid={Boolean(errors.name)}
          />
        </Field>

        <Field label="Email" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          required
          hint="Minimal 8 karakter."
          error={errors.password}
        >
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={Boolean(errors.password)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden />
              ) : (
                <Eye className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </Field>

        <Button type="submit" size="lg" className="w-full" loading={register.isPending}>
          Buat akun
        </Button>
      </form>

      <p className="text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-medium text-brand-600 hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
