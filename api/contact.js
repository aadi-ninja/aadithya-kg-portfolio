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
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase environment variables are not configured.');
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

    return response.status(201).json({ message: 'Your message was sent successfully.' });
  } catch (error) {
    console.error('Contact service request failed:', error);
    return response.status(502).json({ error: 'Unable to send your message right now.' });
  }
}
