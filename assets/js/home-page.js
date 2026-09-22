(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const video = document.querySelector('.home-page .hero-photo-video');
  const syncVideo = () => {
    if (!video) return;
    if (reducedMotion.matches) video.pause();
    else video.play().catch(() => {});
  };
  video?.addEventListener('loadeddata', syncVideo);
  reducedMotion.addEventListener('change', syncVideo);
  syncVideo();

  const stage = document.querySelector('[data-home-stage]');
  if (!stage) return;
  const images = [...stage.querySelectorAll('[data-stage-image]')];
  const triggers = [...stage.querySelectorAll('[data-stage-trigger]')];
  const count = stage.querySelector('[data-stage-count]');
  const title = stage.querySelector('[data-stage-title]');
  const label = stage.querySelector('[data-stage-label]');
  const open = stage.querySelector('[data-stage-open]');
  const caption = stage.querySelector('.stage-caption');
  let active = 0;
  let requested = 0;
  let generation = 0;
  let frame;

  const activate = async (index) => {
    if (index === requested) return;
    requested = index;
    const ticket = ++generation;
    const next = images[index];
    next.loading = 'eager';
    try { await next.decode(); }
    catch { if (ticket === generation) requested = active; return; }
    if (ticket !== generation) return;
    active = index;
    images.forEach((image, i) => image.classList.toggle('is-active', i === index));
    triggers.forEach((trigger, i) => trigger.classList.toggle('is-active', i === index));
    const trigger = triggers[index];
    const name = trigger.querySelector('strong').textContent;
    count.textContent = String(index + 1).padStart(2, '0');
    title.textContent = name;
    label.textContent = trigger.querySelector('small').textContent;
    open.href = trigger.href;
    open.setAttribute('aria-label', `Esplora il progetto ${name}`);
    caption.classList.remove('is-changing');
    requestAnimationFrame(() => caption.classList.add('is-changing'));
  };
  triggers.forEach((trigger, index) => {
    trigger.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') activate(index);
    });
    trigger.addEventListener('focus', () => activate(index));
  });
  // Decode nearby assets before hover while preserving normal lazy loading above.
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    images.forEach(image => { image.loading = 'eager'; image.decode().catch(() => {}); });
    observer.disconnect();
  }, { rootMargin: '400px' });
  observer.observe(stage);

  const resetPointer = () => {
    cancelAnimationFrame(frame);
    stage.classList.remove('is-pointer-active');
    stage.style.setProperty('--stage-x', '0px');
    stage.style.setProperty('--stage-y', '0px');
  };
  stage.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse' || !finePointer.matches || reducedMotion.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rect = stage.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const isProject = !!event.target.closest('.stage-open, .project-stage-item');
      stage.classList.toggle('is-pointer-active', isProject);
      stage.style.setProperty('--cursor-x', `${x}px`);
      stage.style.setProperty('--cursor-y', `${y}px`);
      stage.style.setProperty('--stage-x', `${((x / rect.width) - .5) * -12}px`);
      stage.style.setProperty('--stage-y', `${((y / rect.height) - .5) * -10}px`);
    });
  });
  stage.addEventListener('pointerleave', resetPointer);
  stage.addEventListener('pointercancel', resetPointer);
  stage.addEventListener('keydown', resetPointer);
  reducedMotion.addEventListener('change', resetPointer);
  finePointer.addEventListener('change', resetPointer);
})();
