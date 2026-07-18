let deferredInstallPrompt = null;
const installButton = document.getElementById('installAppButton');

if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js?v=4').catch(error => {
      console.warn('Não foi possível ativar o modo offline.', error);
    });
  });
}

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  installButton.hidden = false;
});

installButton.addEventListener('click', async () => {
  if(!deferredInstallPrompt){
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  installButton.hidden = true;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  installButton.hidden = true;
});
