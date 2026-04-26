import { prisma } from '@/lib/prisma';
import { CheckinClient } from './CheckinClient';

export const dynamic = 'force-dynamic';

export default async function CheckinPage() {
  const [pagas, presentes] = await Promise.all([
    prisma.inscricao.count({ where: { status: 'PAGA' } }),
    prisma.inscricao.count({ where: { status: 'PAGA', checkedInAt: { not: null } } }),
  ]);

  return <CheckinClient pagasInicial={pagas} presentesInicial={presentes} />;
}
