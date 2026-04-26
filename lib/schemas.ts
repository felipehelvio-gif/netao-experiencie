import { z } from 'zod';

const whatsappRegex = /^(\+?55)?\s*\(?\d{2}\)?\s*9?\d{4}-?\d{4}$/;

export const tipoParticipanteEnum = z.enum(['DONO', 'FORNECEDOR', 'PRESTADOR', 'OUTRO']);

export const criarInscricaoSchema = z
  .object({
    nome: z.string().trim().min(3, 'Nome muito curto').max(120),
    whatsapp: z
      .string()
      .trim()
      .refine((v) => whatsappRegex.test(v) || /^\d{10,13}$/.test(v.replace(/\D/g, '')), {
        message: 'WhatsApp inválido',
      }),
    email: z.string().trim().toLowerCase().email('E-mail inválido').max(200),
    tipo: tipoParticipanteEnum,
    restauranteNome: z.string().trim().max(160).optional(),
    empresaNome: z.string().trim().max(160).optional(),
    comoConheceu: z.string().trim().max(500).optional(),
    valorEsperadoCentavos: z.number().int().positive().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.tipo === 'DONO' && !v.restauranteNome) {
      ctx.addIssue({
        code: 'custom',
        path: ['restauranteNome'],
        message: 'Informe o nome do restaurante',
      });
    }
    if ((v.tipo === 'FORNECEDOR' || v.tipo === 'PRESTADOR') && !v.empresaNome) {
      ctx.addIssue({
        code: 'custom',
        path: ['empresaNome'],
        message: 'Informe o nome da empresa',
      });
    }
  });

export type CriarInscricaoInput = z.infer<typeof criarInscricaoSchema>;

export const listaEsperaSchema = z.object({
  nome: z.string().trim().min(3).max(120),
  whatsapp: z
    .string()
    .trim()
    .refine((v) => /^\d{10,13}$/.test(v.replace(/\D/g, '')), 'WhatsApp inválido'),
});

export const adminLoginSchema = z.object({
  password: z.string().min(1).max(200),
});

export const checkinToggleSchema = z.object({
  presente: z.boolean(),
});

export const notasSchema = z.object({
  notas: z.string().max(2000).nullable(),
});
