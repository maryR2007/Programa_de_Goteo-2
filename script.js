document.addEventListener('DOMContentLoaded', () => {
  const $ = (sel) => document.querySelector(sel);
  const fmt = (n, digits = 2) => (Number.isFinite(n) ? n.toLocaleString('es-CO', { maximumFractionDigits: digits }) : '–');

  const inputs = {
    volumen: $('#volumen'),
    tiempoH: $('#tiempoH'),
    tiempoM: $('#tiempoM'),
    factor:  $('#factor'),
    rounding: $('#rounding')
  };

  // Conversión automática: horas -> minutos
  inputs.tiempoH.addEventListener('input', () => {
    const h = parseFloat(inputs.tiempoH.value);
    if (Number.isFinite(h)) {
      inputs.tiempoM.value = Math.max(0, Math.round(h * 60));
    } else {
      inputs.tiempoM.value = '';
    }
  });

  // Botones
  $('#btnEjemplo').addEventListener('click', () => {
    inputs.volumen.value = 1000;
    inputs.tiempoH.value = 8;
    inputs.tiempoM.value = 480;
    inputs.factor.value = '20';
    inputs.rounding.value = 'nearest';
    calc();
    toast('Ejemplo cargado.');
  });

  $('#btnLimpiar').addEventListener('click', () => {
    for (const el of Object.values(inputs)) el.value = '';
    inputs.factor.value = '20';
    inputs.rounding.value = 'nearest';
    $('#results').innerHTML = '';
    $('#kMlH').textContent = '–';
    $('#kGttMin').textContent = '–';
    $('#kTiempo').textContent = '–';
    toast('Formulario restablecido.');
  });

  $('#btnCalcular').addEventListener('click', calc);

  function toast(msg){
    const t = $('#toast');
    t.textContent = msg; 
    t.style.display = 'block';
    setTimeout(()=> t.style.display='none', 2200);
  }

  function calc(){
    const vol = parseFloat(inputs.volumen.value);
    let h   = parseFloat(inputs.tiempoH.value);
    let min = parseFloat(inputs.tiempoM.value);
    const factor = parseFloat(inputs.factor.value);
    const rounding = inputs.rounding.value;

    // Validaciones
    const errs = [];
    if (!Number.isFinite(vol) || vol <= 0) errs.push('Ingresa un volumen válido (>0).');
    if (!Number.isFinite(h) && !Number.isFinite(min)) errs.push('Ingresa el tiempo en horas o minutos.');
    if (Number.isFinite(h) && h < 0) errs.push('Las horas no pueden ser negativas.');
    if (Number.isFinite(min) && min < 0) errs.push('Los minutos no pueden ser negativos.');
    if (!Number.isFinite(factor) || factor <= 0) errs.push('El factor de goteo debe ser mayor a 0.');

    if (errs.length){ toast(errs[0]); return; }

    // Si faltan minutos pero hay horas, convierto; si faltan horas pero hay minutos, las calculo
    if (!Number.isFinite(min) && Number.isFinite(h)) min = h * 60;
    if (!Number.isFinite(h) && Number.isFinite(min)) h = min / 60;

    // Fórmulas:
    const mlh = vol / h; 

    let gttMinRaw = (vol * factor) / min;
    let gttMin;
    switch (rounding){
      case 'ceil': gttMin = Math.ceil(gttMinRaw); break;
      case 'floor': gttMin = Math.floor(gttMinRaw); break;
      default: gttMin = Math.round(gttMinRaw);
    }

    const totalMin = Math.round(min);
    const hh = Math.floor(totalMin / 60); 
    const mm = totalMin % 60;
    const tiempoFmt = `${hh} h ${mm} min`;

    // KPIs
    $('#kMlH').textContent = fmt(mlh);
    $('#kGttMin').textContent = Number.isFinite(gttMin) ? `${gttMin}` : '–';
    $('#kTiempo').textContent = tiempoFmt;

    // Resumen
    const res = $('#results');
    res.innerHTML = '';

    res.appendChild(makeResult(
      'Velocidad (mL/h)',
      `${fmt(mlh)} mL/h`,
      `ml/h = Volumen ÷ Horas = ${fmt(vol,0)} ÷ ${fmt(h,2)} = ${fmt(mlh)} mL/h`
    ));

    res.appendChild(makeResult(
      'Goteo (gtt/min)',
      `${gttMin} gtt/min`,
      `gtt/min = (Volumen × Factor) ÷ Minutos = (${fmt(vol,0)} × ${factor}) ÷ ${fmt(min,0)} = ${fmt(gttMinRaw)} → ${gttMin} gtt/min (${roundName(rounding)})`
    ));

    res.appendChild(makeResult(
      'Tiempo total',
      tiempoFmt,
      `Tiempo = ${fmt(h,2)} h = ${Math.round(min)} min`
    ));

    const gttFromMlh = (mlh * factor) / 60;
    res.appendChild(makeResult(
      'Comprobación',
      `${Math.round(gttFromMlh)} gtt/min`,
      `Usando la equivalencia: gtt/min = (mL/h × Factor) ÷ 60 = (${fmt(mlh)} × ${factor}) ÷ 60 = ${fmt(gttFromMlh)}`
    ));
  }

  function makeResult(title, value, detail){
    const div = document.createElement('div');
    div.className = 'result';
    div.innerHTML = `
      <div>
        <div class="label">${title}</div>
        <div class="big">${value}</div>
      </div>
      <div class="pill">${detail}</div>
    `;
    return div;
  }

  function roundName(key){
    return key === 'ceil' ? 'redondeo hacia arriba' 
         : key === 'floor' ? 'redondeo hacia abajo' 
         : 'redondeo a la más cercana';
  }

  // Enter = calcular
  for (const id of ['volumen','tiempoH','tiempoM']){
    document.querySelector("#"+id).addEventListener('keydown', e=>{ if(e.key==='Enter') calc(); });
  }

  // Autoprueba en consola
  console.log('%cPruebas rápidas','color:#22d3ee');
  (function selfTest(){
    const vol=1000, h=8, min=480, factor=20;
    const mlh=vol/h; const gtt=(vol*factor)/min;
    console.log('Caso test — esperado ml/h=125 →', mlh);
    console.log('Caso test — esperado gtt/min≈41.67 →', gtt);
  })();
});
