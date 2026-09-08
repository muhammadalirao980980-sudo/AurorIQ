(function (global) {
  'use strict';

  const AurorIQ = global.AurorIQ || (global.AurorIQ = {});
  const utils = AurorIQ.utils;

  const STORAGE_KEYS = {
    profile: 'auroriq_profile_v1',
    session: 'auroriq_session_v2'
  };

  const PERSIST_MAP = {
    // Session persists to localStorage (v5.4) so an in-progress test can be
    // resumed after the tab is closed, not just after a reload.
    session: { area: 'local', key: STORAGE_KEYS.session },
    profile: { area: 'local', key: STORAGE_KEYS.profile }
  };

  function defaults() {
    return {
      session: {
        testId: null,
        phase: 'idle',
        currentIndex: 0,
        totalQuestions: 25,
        theta: 0,
        se: 1,
        domain: null,
        responses: [],
        startedAt: null,
        challengeToken: null
      },
      profile: {
        lastResult: null,
        history: [],
        challenges: { wins: 0, losses: 0 },
        intake: {
          name: '',
          age: null,
          ageBand: '',
          gender: '',
          education: '',
          completedAt: null
        }
      },
      ui: {
        navOpen: false
      }
    };
  }

  function getPath(obj, path, fallback) {
    if (!path || path === '*') return obj;
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      if (cur == null) return fallback;
      cur = cur[parts[i]];
    }
    return cur === undefined ? fallback : cur;
  }

  function setPath(obj, path, value) {
    const parts = path.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (typeof cur[key] !== 'object' || cur[key] === null) {
        cur[key] = {};
      }
      cur = cur[key];
    }
    cur[parts[parts.length - 1]] = value;
  }

  function clone(value) {
    try {
      return structuredClone(value);
    } catch (e) {
      return JSON.parse(JSON.stringify(value));
    }
  }

  function createBus() {
    const listeners = new Map();

    function on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event).add(handler);
      return () => off(event, handler);
    }

    function off(event, handler) {
      if (listeners.has(event)) listeners.get(event).delete(handler);
    }

    function emit(event, payload) {
      if (listeners.has(event)) {
        listeners.get(event).forEach((handler) => {
          try {
            handler(payload);
          } catch (e) {}
        });
      }
    }

    return { on, off, emit };
  }

  function createStore() {
    const bus = createBus();
    let data = defaults();

    function loadPersisted() {
      Object.keys(PERSIST_MAP).forEach((root) => {
        const conf = PERSIST_MAP[root];
        if (!utils) return;
        const store = conf.area === 'local' ? utils.storage : utils.session;
        const saved = store.get(conf.key, null);
        if (saved && typeof saved === 'object') {
          data[root] = Object.assign({}, data[root], saved);
        }
      });
    }

    function persist(root) {
      const conf = PERSIST_MAP[root];
      if (!conf || !utils) return;
      const store = conf.area === 'local' ? utils.storage : utils.session;
      store.set(conf.key, data[root]);
    }

    function get(path, fallback) {
      return getPath(data, path, fallback);
    }

    function set(path, value, opts) {
      const silent = opts && opts.silent;
      const prev = getPath(data, path);
      setPath(data, path, value);
      const root = path.split('.')[0];
      persist(root);
      if (!silent) {
        bus.emit('change:' + path, { path: path, value: value, prev: prev });
        bus.emit('change', { path: path, value: value, prev: prev });
      }
      return value;
    }

    function update(path, partial) {
      const current = getPath(data, path, {});
      const merged = Object.assign({}, current, partial);
      return set(path, merged);
    }

    function push(path, item) {
      const arr = getPath(data, path, []);
      const next = arr.concat([item]);
      return set(path, next);
    }

    function subscribe(path, handler) {
      return bus.on('change:' + path, handler);
    }

    function subscribeAny(handler) {
      return bus.on('change', handler);
    }

    function reset(root) {
      if (root) {
        data[root] = defaults()[root];
        persist(root);
        bus.emit('change:' + root, { path: root, value: data[root] });
      } else {
        data = defaults();
        Object.keys(PERSIST_MAP).forEach(persist);
        bus.emit('change', { path: '*', value: data });
      }
    }

    function snapshot() {
      return clone(data);
    }

    loadPersisted();

    return {
      get: get,
      set: set,
      update: update,
      push: push,
      subscribe: subscribe,
      subscribeAny: subscribeAny,
      reset: reset,
      snapshot: snapshot,
      on: bus.on,
      off: bus.off,
      emit: bus.emit
    };
  }

  AurorIQ.state = createStore();

})(window);
