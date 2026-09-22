(() => {
  const page = document.querySelector('.guess-editorial');
  if (!page) return;
  const links = [...page.querySelectorAll('[data-store-link]')];
  const stores = [...page.querySelectorAll('[data-store]')];
  const selectStore = id => {
    if (!stores.some(store => store.id === id)) return;
    stores.forEach(store => { store.hidden = store.id !== id; });
    links.forEach(link => link.setAttribute('aria-current', String(link.hash === '#' + id)));
  };
  const initial = stores.some(store => '#' + store.id === location.hash) ? location.hash.slice(1) : stores[0]?.id;
  selectStore(initial);
  links.forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    selectStore(link.hash.slice(1));
    history.replaceState(null, '', link.hash);
    if (matchMedia('(max-width:640px)').matches) document.getElementById(link.hash.slice(1)).scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});
  }));
  addEventListener('hashchange', () => selectStore(location.hash.slice(1)));
  page.querySelector('.project-map')?.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (!link) return;
    const id = new URL(link.getAttribute('href'), location.href).hash.slice(1);
    if (!stores.some(store => store.id === id)) return;
    event.preventDefault();
    selectStore(id);
    history.replaceState(null, '', '#' + id);
    document.getElementById(id).scrollIntoView({block:'start'});
  });
  page.querySelectorAll('[data-photo-thumb]').forEach(button => button.addEventListener('click', () => {
    const store = button.closest('[data-store]');
    const img = store.querySelector('[data-main-photo]');
    img.src = button.dataset.src;
    img.alt = button.dataset.alt;
    store.querySelectorAll('[data-photo-thumb]').forEach(thumb => thumb.setAttribute('aria-pressed', String(thumb === button)));
  }));
  const dialog = page.querySelector('.g-photo-dialog');
  let opener;
  page.querySelectorAll('[data-photo-open]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    const source = button.querySelector('img');
    const target = dialog.querySelector('img');
    target.src = source.currentSrc || source.src;
    target.alt = source.alt;
    dialog.querySelector('p').textContent = source.alt;
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
  }));
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { document.documentElement.style.overflow = ''; opener?.focus(); });
})();
