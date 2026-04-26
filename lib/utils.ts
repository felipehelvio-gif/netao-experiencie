import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

export function padComanda(n: number): string {
  return String(n).padStart(3, '0');
}

export function primeiroNome(nomeCompleto: string): string {
  return nomeCompleto.trim().split(/\s+/)[0] ?? nomeCompleto;
}

export function normalizarWhatsapp(input: string): string {
  const digitos = input.replace(/\D/g, '');
  if (digitos.length === 0) return '';
  if (digitos.startsWith('55')) return digitos;
  return `55${digitos}`;
}

export function formatarWhatsappBR(input: string): string {
  const d = input.replace(/\D/g, '').replace(/^55/, '');
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

export function isWhatsappValido(input: string): boolean {
  const d = input.replace(/\D/g, '').replace(/^55/, '');
  return d.length === 10 || d.length === 11;
}
