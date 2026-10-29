import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://dtqovluugfunwsjjsmfn.supabase.co',
  'sb_publishable_LLnwITuQ7yXfTk1UCMuZeQ_Re4rzQoK'
);
const $ = (selector, context = document) => context.querySelector(selector);
const loginPanel = $('#login-panel');
const dashboard = $('#dashboard');
const status = $('#dashboard-status');
const setStatus = message => { status.textContent = message; };

const showDashboard = () => {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  $('#sign-out').hidden = false;
};

const showLogin = () => {
  loginPanel.hidden = false;
  dashboard.hidden = true;
  $('#sign-out').hidden = true;
};

const loadHero = async () => {
  const { data, error } = await supabase.from('site_content').select('content').eq('section', 'hero').maybeSingle();
  if (error) throw error;
  const content = data?.content || {};
  $('#hero-intro').value = content.intro || '';
  $('#hero-role').value = content.role || 'Software Engineer';
};

const loadProjects = async () => {
  const { data, error } = await supabase.from('projects').select('*').order('display_order').order('id');
  if (error) throw error;
  $('#projects-list').replaceChildren(...data.map(project => {
    const item = document.createElement('article');
    item.innerHTML = `<div><h3></h3><p></p><small></small></div><button class="btn ghost" type="button">Delete</button>`;
    $('h3', item).textContent = project.title;
    $('p', item).textContent = project.description;
    $('small', item).textContent = `${project.category} · ${(project.technologies || []).join(', ')}`;
    $('button', item).addEventListener('click', () => deleteRecord('projects', project.id, loadProjects));
    return item;
  }));
};

const loadCertifications = async () => {
  const { data, error } = await supabase.from('certifications').select('*').order('display_order').order('id');
  if (error) throw error;
  $('#certifications-list').replaceChildren(...data.map(certification => {
    const item = document.createElement('article');
    item.innerHTML = `<div><h3></h3><p></p></div><button class="btn ghost" type="button">Delete</button>`;
    $('h3', item).textContent = certification.title;
    $('p', item).textContent = `${certification.issuer} · ${certification.issued_at}`;
    $('button', item).addEventListener('click', () => deleteRecord('certifications', certification.id, loadCertifications));
    return item;
  }));
};

const deleteRecord = async (table, id, reload) => {
  if (!confirm('Delete this item?')) return;
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) { setStatus(error.message); return; }
  await reload();
  setStatus('Item deleted.');
};

const loadDashboard = async () => {
  try {
    await Promise.all([loadHero(), loadProjects(), loadCertifications()]);
    setStatus('');
  } catch (error) {
    setStatus(`Unable to load dashboard: ${error.message}`);
  }
};

$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  setStatus('Signing in...');
  const { error } = await supabase.auth.signInWithPassword({
    email: $('#login-email').value.trim(),
    password: $('#login-password').value
  });
  if (error) { setStatus(error.message); return; }
  showDashboard();
  await loadDashboard();
});

$('#sign-out').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) { setStatus(error.message); return; }
  showLogin();
});

$('#hero-form').addEventListener('submit', async event => {
  event.preventDefault();
  const content = { intro: $('#hero-intro').value.trim(), role: $('#hero-role').value.trim() };
  const { error } = await supabase.from('site_content').upsert({ section: 'hero', content }, { onConflict: 'section' });
  setStatus(error ? error.message : 'Hero content saved.');
});

$('#project-form').addEventListener('submit', async event => {
  event.preventDefault();
  const technologies = $('#project-technologies').value.split(',').map(value => value.trim()).filter(Boolean);
  const { error } = await supabase.from('projects').insert({
    title: $('#project-title').value.trim(),
    description: $('#project-description').value.trim(),
    category: $('#project-category').value,
    technologies,
    project_url: $('#project-url').value.trim() || null
  });
  if (error) { setStatus(error.message); return; }
  event.target.reset();
  await loadProjects();
  setStatus('Project added.');
});

$('#certification-form').addEventListener('submit', async event => {
  event.preventDefault();
  const { error } = await supabase.from('certifications').insert({
    issuer: $('#certification-issuer').value.trim(),
    title: $('#certification-title').value.trim(),
    issued_at: $('#certification-issued').value.trim(),
    certificate_url: $('#certification-url').value.trim()
  });
  if (error) { setStatus(error.message); return; }
  event.target.reset();
  await loadCertifications();
  setStatus('Certification added.');
});

const { data: { session } } = await supabase.auth.getSession();
if (session) { showDashboard(); await loadDashboard(); }
supabase.auth.onAuthStateChange((_event, currentSession) => {
  if (!currentSession) showLogin();
});
