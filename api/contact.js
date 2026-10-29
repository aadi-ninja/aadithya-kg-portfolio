const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const { name, email, subject, message } = request.body || {};
  const values = { name, email, subject, message };

  if (
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof subject !== 'string' ||
    typeof message !== 'string' ||
    name.trim().length < 2 ||
    !emailPattern.test(email.trim()) ||
    subject.trim().length < 3 ||
    message.trim().length < 10
  ) {
    return response.status(400).json({ error: 'Please provide valid contact details and a message.' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'Portfolio <onboarding@resend.dev>';
  const toEmail = process.env.RESEND_TO_EMAIL || 'aadithyakg04@gmail.com';
  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    console.error('Contact service environment variables are not configured.');
    return response.status(500).json({ error: 'The contact service is not configured.' });
  }

  try {
    const result = await fetch(`${supabaseUrl}/rest/v1/contact_messages`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({
        name: values.name.trim(),
        email: values.email.trim(),
        subject: values.subject.trim(),
        message: values.message.trim()
      })
    });

    if (!result.ok) {
      const details = await result.text();
      console.error('Supabase contact insert failed:', result.status, details);
      return response.status(502).json({ error: 'Unable to save your message right now.' });
    }

    const emailResult = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [toEmail],
        reply_to: values.email.trim(),
        subject: `Portfolio contact: ${values.subject.trim()}`,
        text: [
          `Name: ${values.name.trim()}`,
          `Email: ${values.email.trim()}`,
          `Subject: ${values.subject.trim()}`,
          '',
          values.message.trim()
        ].join('\n')
      })
    });

    if (!emailResult.ok) {
      const details = await emailResult.text();
      console.error('Resend notification failed:', emailResult.status, details);
      return response.status(502).json({ error: 'Your message was saved, but the notification could not be sent.' });
    }

    return response.status(201).json({ message: 'Your message was sent successfully.' });
  } catch (error) {
    console.error('Contact service request failed:', error);
    return response.status(502).json({ error: 'Unable to send your message right now.' });
  }
}
