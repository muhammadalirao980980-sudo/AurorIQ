(function (global, document) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  const utils = AurorIQ.utils;
  const state = AurorIQ.state;

  /* Age bands used for norm context + result personalisation.
     Ordered; first match wins. Mirrors how age-adjusted IQ norms
     are grouped in validated instruments. */
  const AGE_BANDS = [
    { min: 5,  max: 8,  label: '5–8 years' },
    { min: 9,  max: 12, label: '9–12 years' },
    { min: 13, max: 15, label: '13–15 years' },
    { min: 16, max: 17, label: '16–17 years' },
    { min: 18, max: 24, label: '18–24 years' },
    { min: 25, max: 34, label: '25–34 years' },
    { min: 35, max: 44, label: '35–44 years' },
    { min: 45, max: 54, label: '45–54 years' },
    { min: 55, max: 64, label: '55–64 years' },
    { min: 65, max: 120, label: '65+ years' }
  ];

  function bandFor(age) {
    if (age == null || isNaN(age)) return null;
    for (let i = 0; i < AGE_BANDS.length; i++) {
      if (age >= AGE_BANDS[i].min && age <= AGE_BANDS[i].max) return AGE_BANDS[i];
    }
    return null;
  }

  function bindElements() {
    return {
      form: utils.$('[data-intake-form]'),
      name: utils.$('[data-intake-name]'),
      age: utils.$('[data-intake-age]'),
      ageBand: utils.$('[data-intake-ageband]'),
      ageBandText: utils.$('[data-intake-ageband-text]'),
      genders: utils.$all('[data-intake-gender]'),
      educations: utils.$all('[data-intake-education]'),
      error: utils.$('[data-intake-error]')
    };
  }

  function readChecked(list) {
    for (let i = 0; i < list.length; i++) {
      if (list[i].checked) return list[i].value;
    }
    return '';
  }

  function updateAgeBand(els) {
    const raw = parseInt(els.age.value, 10);
    const band = bandFor(raw);
    if (band) {
      els.ageBand.classList.add('is-set');
      els.ageBandText.innerHTML = 'Compared to the <strong>' + band.label + '</strong> group';
    } else {
      els.ageBand.classList.remove('is-set');
      els.ageBandText.textContent = 'Your result will be compared to this age group';
    }
  }

  function showError(els, msg) {
    if (!els.error) return;
    if (msg) {
      els.error.textContent = msg;
      els.error.hidden = false;
    } else {
      els.error.textContent = '';
      els.error.hidden = true;
    }
  }

  /* Collect the current form values into a clean profile object.
     Age is validated softly: an out-of-range age is treated as blank
     rather than blocking the user. */
  function collect(els) {
    const name = (els.name.value || '').trim().slice(0, 40);
    let age = parseInt(els.age.value, 10);
    if (isNaN(age) || age < 5 || age > 120) age = null;
    const band = bandFor(age);
    return {
      name: name,
      age: age,
      ageBand: band ? band.label : '',
      gender: readChecked(els.genders),
      education: readChecked(els.educations),
      completedAt: new Date().toISOString()
    };
  }

  function save(profile) {
    if (state) {
      state.set('profile.intake', profile);
    } else if (utils && utils.storage) {
      // Fallback if state module is unavailable for any reason.
      const existing = utils.storage.get('auroriq_profile_v1', {}) || {};
      existing.intake = profile;
      utils.storage.set('auroriq_profile_v1', existing);
    }
  }

  /* Prefill from a previously saved intake so returning users
     don't re-enter everything. */
  function prefill(els) {
    const saved = state ? state.get('profile.intake', null) : null;
    if (!saved) return;
    if (saved.name) els.name.value = saved.name;
    if (saved.age != null) { els.age.value = String(saved.age); updateAgeBand(els); }
    if (saved.gender) {
      els.genders.forEach((r) => { if (r.value === saved.gender) r.checked = true; });
    }
    if (saved.education) {
      els.educations.forEach((r) => { if (r.value === saved.education) r.checked = true; });
    }
  }

  let els = null;

  function init() {
    if (!utils) return;
    els = bindElements();
    if (!els.form) return;

    prefill(els);

    if (els.age) {
      utils.on(els.age, 'input', () => { updateAgeBand(els); showError(els, ''); });
    }
    [].concat(
      Array.prototype.slice.call(els.genders),
      Array.prototype.slice.call(els.educations)
    ).forEach((input) => {
      utils.on(input, 'change', () => showError(els, ''));
    });
  }

  /* Public API consumed by test.js */
  AurorIQ.intake = {
    init: init,
    /* Persist whatever is currently entered. Returns the saved profile.
       `opts.skip` marks that the user chose to skip (still saved, blank). */
    commit: function (opts) {
      if (!els) return null;
      const profile = collect(els);
      if (opts && opts.skip) {
        profile.completedAt = null;
      }
      save(profile);
      return profile;
    },
    getSaved: function () {
      return state ? state.get('profile.intake', null) : null;
    },
    bandFor: bandFor
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})(window, document);
