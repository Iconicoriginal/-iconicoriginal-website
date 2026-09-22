(() => {
  document.querySelectorAll('[data-comparison]').forEach(comparison => {
    const range = comparison.querySelector('input[type="range"]');
    const update = () => {
      comparison.style.setProperty('--reveal', `${range.value}%`);
      range.setAttribute('aria-valuetext', `${range.value}% prima, ${100 - Number(range.value)}% dopo`);
    };
    range.addEventListener('input', update);
    update();
  });
  const film = document.querySelector('.m-single-film');
  document.querySelectorAll('[data-film]').forEach(button => {
    button.addEventListener('click', () => {
      if (!film || button.getAttribute('aria-pressed') === 'true') return;
      film.pause();
      const state = button.dataset.film;
      film.src = `/assets/video/savhotel-mantegna/savhotel-mantegna-corridoio-${state}.mp4`;
      if (state === 'dopo') {
        film.poster = '/assets/img/realizzazioni/savhotel-mantegna/savhotel-mantegna-corridoio-finale.webp';
      } else {
        film.removeAttribute('poster');
      }
      film.setAttribute('aria-label', `Corridoio ${state} la riqualificazione`);
      film.load();
      document.querySelectorAll('[data-film]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    });
  });
  const dialog = document.querySelector('.m-photo-dialog');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  const fullImage = dialog.querySelector('img');
  const caption = dialog.querySelector('p');
  let opener;
  let previousOverflow;
  document.querySelectorAll('[data-m-photo]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      fullImage.src = link.href;
      fullImage.alt = link.querySelector('img').alt;
      caption.textContent = fullImage.alt;
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
    });
  });
  dialog.querySelector('button').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow || '';
    opener?.focus({ preventScroll: true });
  });
})();
