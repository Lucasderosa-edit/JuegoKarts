// Conecta los eventos de una carrera con los sonidos.
export function attachRaceAudio(race, audio) {
  const players = race.players.map((p) => p.kart);
  const pans = players.length === 1 ? [0] : [-0.6, 0.6];
  const engines = players.map((_, i) => audio.createEngine(pans[i]));
  let rollTimer = 0;

  // Volumen según la distancia al jugador más cercano
  const near = (x, z) => {
    let best = 0;
    for (const k of players) {
      const d = Math.hypot(k.position.x - x, k.position.z - z);
      best = Math.max(best, 1 - d / 70);
    }
    return Math.max(0, best);
  };
  const isPlayer = (k) => players.includes(k);

  race.on('countdown', ({ n }) => audio.sfx(n > 0 ? 'count' : 'go'));
  race.on('bump', ({ a, b, strength }) => {
    if (strength < 0.08) return;
    const k = isPlayer(a) || isPlayer(b) ? 1 : near(a.position.x, a.position.z) * 0.6;
    audio.sfx('bump', k * Math.min(1, 0.4 + strength));
  });
  race.on('wall', ({ kart, strength }) => {
    if (strength < 3) return;
    audio.sfx('wall', (isPlayer(kart) ? 1 : near(kart.position.x, kart.position.z) * 0.5) * Math.min(1, strength / 12));
  });
  race.on('itemBox', ({ kart }) => { if (isPlayer(kart)) audio.sfx('itemBox'); });
  race.on('itemGot', ({ kart }) => { if (isPlayer(kart)) audio.sfx('itemGot'); });
  race.on('itemUse', ({ kart, item }) => {
    const k = isPlayer(kart) ? 1 : near(kart.position.x, kart.position.z) * 0.7;
    if (item === 'proyectil') audio.sfx('projectile', k);
    else if (item === 'trampa') audio.sfx('trap', k);
    else if (item === 'escudo') audio.sfx('shield', k);
  });
  race.on('hit', ({ kart }) => audio.sfx('hit', isPlayer(kart) ? 1 : near(kart.position.x, kart.position.z)));
  race.on('shieldBreak', ({ kart }) => audio.sfx('shieldBreak', isPlayer(kart) ? 1 : near(kart.position.x, kart.position.z)));
  race.on('obstacle', ({ kart, type }) => {
    const k = isPlayer(kart) ? 1 : near(kart.position.x, kart.position.z) * 0.6;
    if (type === 'wave') audio.sfx('splash', k);
    else if (type === 'cone') audio.sfx('bump', k * 0.5);
  });
  race.on('lap', ({ kart, final }) => {
    if (!isPlayer(kart)) return;
    audio.sfx(final ? 'finalLap' : 'lap');
    if (final) audio.setMusicTempo(1.1);
  });
  race.on('finish', ({ kart }) => {
    if (!isPlayer(kart)) return;
    audio.sfx('finish');
    if (players.every((k) => k.progress.finished)) setTimeout(() => audio.playMusic('results'), 1500);
  });

  return {
    update(dt, paused) {
      players.forEach((k, i) => audio.updateEngine(engines[i], k, !paused && race.state !== 'finished'));
      rollTimer -= dt;
      if (rollTimer <= 0 && !paused) {
        rollTimer = 0.075;
        if (players.some((k) => k.itemRoll > 0)) audio.sfx('roll');
      }
    },
    dispose() {
      audio.stopEngines();
    },
  };
}
