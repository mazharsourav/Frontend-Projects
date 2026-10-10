/* Themed replacement for confirm() / prompt(). Resolves true/false for a plain
   confirmation, or the entered string / null when `input` is given.

   The promise is answered synchronously when the user acts. The native "close" event is
   only a safety net: browsers may deliver it noticeably late, and waiting for it would
   leave the caller hanging (or answer the next dialog by mistake). */
const openDialog = (() => {
  const dlg = $('#dialog');
  const title = $('#dialogTitle'), message = $('#dialogMessage');
  const field = $('#dialogField'), input = $('#dialogInput'), inputLabel = $('#dialogInputLabel');
  const okBtn = $('#dialogOk'), cancelBtn = $('#dialogCancel');

  let hasInput = false;
  let settle = null;

  function answer(accepted){
    const resolve = settle;
    if(!resolve) return;
    settle = null;
    resolve(hasInput ? (accepted ? input.value : null) : accepted);
  }

  function close(kind){
    answer(kind === 'ok');
    if(dlg.open) dlg.close(kind);
  }

  $('#dialogForm').addEventListener('submit', e => { e.preventDefault(); close('ok'); });
  cancelBtn.addEventListener('click', () => close('cancel'));
  dlg.addEventListener('click', e => { if(e.target === dlg) close('cancel'); });

  // Esc: take over from the browser so it goes through the same synchronous path.
  dlg.addEventListener('cancel', e => { e.preventDefault(); close('cancel'); });

  // Safety net for closes that bypass the handlers above. A stale event from a dialog that
  // has been re-opened is ignored.
  dlg.addEventListener('close', () => { if(!dlg.open) answer(dlg.returnValue === 'ok'); });

  return function open({ heading, text = '', confirmText = 'OK', cancelText = 'Cancel', input: field_ = null, focus = 'confirm' }){
    if(dlg.open) return Promise.resolve(field_ ? null : false);
    answer(dlg.returnValue === 'ok');   // settle anything still pending from a previous dialog

    hasInput = !!field_;
    title.textContent = heading;
    message.textContent = text;
    message.hidden = !text;

    field.hidden = !field_;
    if(field_){
      inputLabel.textContent = field_.label || '';
      input.value = field_.value || '';
      input.readOnly = !!field_.readonly;
    }

    okBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText || 'Cancel';
    cancelBtn.hidden = !cancelText;

    dlg.returnValue = '';
    return new Promise(resolve => {
      settle = resolve;
      dlg.showModal();
      if(field_){ input.focus(); input.select(); }
      else (focus === 'cancel' && cancelText ? cancelBtn : okBtn).focus();
    });
  };
})();
