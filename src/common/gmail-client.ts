import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

export async function getGmailAuth(): Promise<OAuth2Client> {
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,     // From your credentials.json
      process.env.GMAIL_CLIENT_SECRET, // From your credentials.json
      'http://localhost:3000/oauth2callback' // Redirect URI (must match Google Console)
    );
  
    // Set the refresh token stored in GitHub Secrets
    auth.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });
  
    return auth;
}

export async function getMessage(auth: OAuth2Client, query: string): Promise<{ msg: string | null | undefined, date: Date | null}> {
  
  const gmail = google.gmail({ version: 'v1', auth });

  // 1. Find the most recent OTP email from PG&E
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: query,
    maxResults: 1
  });

  const messageId = res.data.messages?.[0]?.id;
  if (!messageId) return { msg: "", date: null};

  // 2. Get the full message content
  const msg = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full'
  });

  // 3. Decode body and extract 6-digit code
  const body = msg.data.snippet;
  
  const internalDate = msg.data.internalDate; // Epoch ms
  const date = new Date(parseInt(internalDate!));

  return { msg: body, date: date };
}

export async function getOTP(auth: OAuth2Client) : Promise<string> {
  const lastEmail = await getMessage(auth, 'no-reply@myacct.pge.com subject:"Please find your security code"');

  const otpMatch = lastEmail.msg?.match(/\b\d{6}\b/); // Regex for 6 consecutive digits

  return otpMatch ? otpMatch[0] : "";
}

export async function sendBill(auth: any, 
    emailRequest: { recipients: string, address: string, amount: number, dates: {start: string, end:string } },
    zelleEmail: string) {

    const to = emailRequest.recipients;
    const address = emailRequest.address;
    const startDate = emailRequest.dates.start;
    const endDate = emailRequest.dates.end;
    const amount = emailRequest.amount;
    const gmail = google.gmail({ version: 'v1', auth });

    const zellePaymentReceived = await getMessage(auth, 'email@transfers.ally.com subject:We deposited your Zelle payment');
    
    // 1. Check if a Zelle payment email has been received in the last 7 days that matches the amount and address. If so, skip sending the email.
    if (zellePaymentReceived && zellePaymentReceived.date instanceof Date && (Date.now() - zellePaymentReceived.date.getTime()) < 86400000 * 7) { // 7-day window
      const zellePaymentMsg = zellePaymentReceived.msg?.toLowerCase() ?? "";
      // Captures the first three words of the address to check for a match in the email, since the full address may not be included in the Zelle payment notification email. This is a heuristic to increase the likelihood of correctly identifying relevant payment emails without requiring an exact full address match.
      const firstThreeAddressWords = address
                                      .replace(/[^a-zA-Z0-9\s]/g, '') // Removes special characters, keeps spaces
                                      .trim()
                                      .split(/\s+/)
                                      .slice(0, 3)
                                      .join(" ")
                                      .toLowerCase();

      if (!zellePaymentMsg || !zellePaymentMsg.includes(firstThreeAddressWords) || !zellePaymentMsg.includes(amount.toFixed(2))) {
          console.log('Zelle payment received no email will be sent.');
          return;
      }
    }
    else {
      console.log('Zelle payment received but not within the last 7 days.');
      return;
    }

  // 2. Construct the email content
  const emailLines = [
    `To: ${to}`,
    `Subject: Your Gas Bill Usage / Su Consumo de Gas - ${address}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    `Hello,`,
    `This is your gas bill usage for the amount of $${amount.toFixed(2)} between ${startDate} and ${endDate}.`,
    `Please send this amount via Zelle to: ${zelleEmail}`,
    `Please send this Zelle amount by end of the 1st of next month.`,
    '',
    '---',
    '',
    `Hola,`,
    `Este es su consumo de gas por la cantidad de $${amount.toFixed(2)} entre el ${startDate} y el ${endDate}.`,
    `Por favor, envíe esta cantidad a través de Zelle a: ${zelleEmail}`,
    `Por favor, envíe este pago por Zelle antes de que termine el día 1 del próximo mes`
  ];

  const email = emailLines.join('\r\n');

  // 3. Encode to Base64url
  const encodedMessage = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // 4. Send via Gmail API
  try {
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    console.log('Email sent successfully:', res.data.id);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}