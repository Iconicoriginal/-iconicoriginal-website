(() => {
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
