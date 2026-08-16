(() => {
  const API = 'https://ssoulvrdgdmzwaorvnrl.supabase.co';
  const KEY = 'sb_publishable_wlRSSgkUX9NaA8qd08RFNw_dDhKMhXE';
  const root = document.querySelector('[data-engagement-slug]');
  if (!root) return;
  const slug = root.dataset.engagementSlug;
  const reads = root.querySelector('[data-reads]');
  const useful = root.querySelector('[data-useful]');
  const button = root.querySelector('[data-useful-button]');
  const headers = {'Content-Type':'application/json','apikey':KEY};
  async function call(name) {
    const r = await fetch(API + '/rest/v1/rpc/' + name, {method:'POST',headers,body:JSON.stringify({article_slug:slug})});
    if (!r.ok) throw new Error('request failed');
    const x = await r.json(); return Array.isArray(x) ? x[0] : x;
  }
  function show(x) {
    if (!x) return;
    if (reads) reads.textContent = Number(x.reads || 0).toLocaleString('en-GB');
    if (useful) useful.textContent = Number(x.useful || 0).toLocaleString('en-GB');
  }
  call('increment_blog_read').then(show).catch(()=>{});
  const k='cwh-useful-'+slug;
  if (localStorage.getItem(k)==='1' && button) { button.disabled=true; button.classList.add('is-liked'); }
  if (button) button.addEventListener('click', async()=>{
    if (localStorage.getItem(k)==='1') return;
    button.disabled=true;
    try { const x=await call('increment_blog_useful'); localStorage.setItem(k,'1'); button.classList.add('is-liked'); show(x); }
    catch(e) { button.disabled=false; }
  });
})();
