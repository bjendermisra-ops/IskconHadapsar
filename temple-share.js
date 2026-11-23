/* Edit these website settings to change app invitations across pages. */
(() => {
  'use strict';
  if (window.TempleShare && window.TempleShare.version === 2) return;
  const config = Object.freeze({
    url: 'https://www.iskconhadapsar.online/app',
    image: '/krishna.webp', // Set to '' for a text-only invitation.
    messages: {
      hi: 'हरे कृष्ण! 🙏 इस्कॉन हडपसर के लाइव दर्शन, जप और एकादशी की जानकारी इस ऐप पर पाएं।',
      mr: 'हरे कृष्ण! 🙏 इस्कॉन हडपसरचे थेट दर्शन, जप आणि एकादशीची माहिती या ॲपवर मिळवा.',
      en: 'Hare Krishna! 🙏 Join ISKCON Hadapsar for live darshan, japa and Ekadashi reminders.'
    }
  });
  const native = location.origin === 'https://iskconhadapsar.vercel.app' && /HadapsarMedia\/1\b/.test(navigator.userAgent);
  function address(value) {
    const u = new URL(value, location.href);
    if (u.protocol !== 'https:' || u.username || u.password) throw Error('Choose an HTTPS media link.');
    return u.href;
  }
  function route(action, params) {
    location.assign('/__native_action__/' + action + '?' + new URLSearchParams(params));
  }
  async function perform(action, {url = '', text = '', title = ''} = {}) {
    try {
      if (url) url = address(url);
      if (native) { route(action, {url, text, title}); return; }
      if (location.origin === 'https://iskconhadapsar.vercel.app' && window.AndroidBridge) {
        if (action === 'share-image' && typeof AndroidBridge.shareImage === 'function') { AndroidBridge.shareImage(url,text); return; }
        if (action === 'share-text' && typeof AndroidBridge.shareText === 'function') { AndroidBridge.shareText([text,url].filter(Boolean).join('\n')); return; }
      }
      if (action === 'share-text' || action === 'share-image') {
        if (!navigator.share) throw Error('Open this page in the ISKCON Hadapsar app to share.');
        const data = {text};
        if (title) data.title = title;
        if (action === 'share-image') {
          const res = await fetch(url);
          if (!res.ok) throw Error('The image could not be loaded.');
          const blob = await res.blob();
          if (!blob.type.startsWith('image/')) throw Error('Choose an image file.');
          const file = new File([blob], 'Darshan.' + blob.type.slice(6).replace('jpeg','jpg'), {type:blob.type});
          if (!navigator.canShare || !navigator.canShare({files:[file]})) throw Error('Open the app to share this image.');
          data.files = [file];
        } else if (url) data.url = url;
        await navigator.share(data);
      } else if (action === 'download' || action === 'save-image') {
        const res = await fetch(url);
        if (!res.ok) throw Error('The download could not be started.');
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = title || new URL(url).pathname.split('/').pop() || 'Media';
        document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      } else throw Error('Open this page in the updated ISKCON Hadapsar Android app.');
    } catch (e) { if (e.name !== 'AbortError') window.alert(e.message || 'Please try again.'); }
  }
  function shareApp(lang) {
    const text = (config.messages[lang] || config.messages.en) + '\n' + config.url;
    return config.image ? perform('share-image', {url:config.image, text}) : perform('share-text',{text});
  }
  const api = {
    version:2, native, config, shareApp,
    openSaved:()=>perform("saved-media"),
    previewMedia:(url,title)=>perform("preview-media",{url,title}),
    shareText:(text,url='') => perform('share-text',{text,url}),
    shareImage:(url,text='') => perform('share-image',{url,text}),
    saveImage:(url,title='') => perform('save-image',{url,title}),
    download:(url,title='') => perform('download',{url,title}),
    setWallpaper:(url,title) => perform('wallpaper',{url,title}),
    setRingtone:(url,title='') => perform('ringtone',{url,title})
  };
  window.TempleShare = Object.freeze(api);
  document.addEventListener('click', e => {
    const el = e.target.closest && e.target.closest('[data-temple-action]');
    if (!el) return;
    const {templeAction:action, url, text, title} = el.dataset;
    if (!['share-app','share-text','share-image','save-image','download','wallpaper','ringtone'].includes(action)) return;
    e.preventDefault();
    if (action === 'share-app') shareApp(localStorage.getItem('lang'));
    else perform(action,{url,text,title});
  });
})();
