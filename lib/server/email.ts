import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type OutgoingMail = {
  to: string;
  subject: string;
  text: string;
};

/**
 * Wysyła e-mail przez Resend (REST). Bez `RESEND_API_KEY` i `EMAIL_FROM` zapisuje wiadomość
 * do katalogu `.data/outbox`, żeby w rozwoju nic nie wychodziło na zewnątrz.
 */
export async function sendMail(mail: OutgoingMail): Promise<{ mode: 'resend' | 'outbox' }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (apiKey && from) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text }),
    });
    if (!response.ok) {
      throw new Error(`Resend zwrócił ${response.status}: ${await response.text()}`);
    }
    return { mode: 'resend' };
  }

  const dir = path.join(process.cwd(), '.data', 'outbox');
  await mkdir(/*turbopackIgnore: true*/ dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}-${randomUUID().slice(0, 8)}.txt`);
  await writeFile(/*turbopackIgnore: true*/ file, `To: ${mail.to}\nSubject: ${mail.subject}\n\n${mail.text}\n`, 'utf8');
  return { mode: 'outbox' };
}
