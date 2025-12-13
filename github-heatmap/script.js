// script.js — GitHub public repos + contribution heatmap (no auth)
// Uses GitHub REST API for repositories and user public events to approximate contributions.

const fetchBtn = document.getElementById('fetchBtn');
const usernameInput = document.getElementById('username');
const profileSection = document.getElementById('profile');
const reposList = document.getElementById('reposList');
const heatmapContainer = document.getElementById('heatmapContainer');
const heatmapLegend = document.getElementById('heatmapLegend');
const profileTitle = document.getElementById('profileTitle');
const profileMeta = document.getElementById('profileMeta');
const errorBox = document.getElementById('error');

// Basic color scale (5 levels) similar to GitHub's green palette
const COLORS = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];

fetchBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  if (!username) return showError('Please enter a GitHub username');
  clearError();
  loadProfile(username);
});

usernameInput.addEventListener('keypress', (e)=>{ if(e.key==='Enter') fetchBtn.click(); });

async function loadProfile(username){
  profileSection.hidden = true;
  reposList.innerHTML = 'Loading...';
  heatmapContainer.innerHTML = 'Loading...';
  profileTitle.textContent = '';
  profileMeta.textContent = '';

  try{
    const userResp = await fetchJson(`https://api.github.com/users/${encodeURIComponent(username)}`);
    if (userResp.message === 'Not Found') return showError('User not found');

    profileTitle.textContent = userResp.login + (userResp.name ? ` — ${userResp.name}` : '');
    profileMeta.textContent = `${userResp.public_repos} public repos • ${userResp.followers} followers`;

    // fetch repos
    fetchRepos(username);

    // fetch events (public) and build heatmap
    fetchContributionsAndRender(username);

    profileSection.hidden = false;
  }catch(err){
    console.error(err);
    showError('Failed to fetch profile. Check console for details.');
  }
}

async function fetchJson(url){
  const r = await fetch(url);
  return r.json();
}

async function fetchRepos(username){
  reposList.innerHTML = 'Loading...';
  try{
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Failed to fetch repos');
    const repos = await resp.json();

    if (!Array.isArray(repos) || repos.length===0){
      reposList.innerHTML = '<p class="muted">No public repositories found</p>';
      return;
    }

    reposList.innerHTML = '';
    // Render basic repo info
    repos.forEach(r => {
      const node = document.createElement('div');
      node.className = 'repo';
      node.innerHTML = `
        <h4><a href="${r.html_url}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a></h4>
        <p>${escapeHtml(r.description || '')}</p>
        <div class="meta"><span>⭐ ${r.stargazers_count}</span><span>🍴 ${r.forks_count}</span><span class="muted">Updated ${new Date(r.updated_at).toLocaleString()}</span></div>
      `;
      reposList.appendChild(node);
    });
  }catch(err){
    console.error(err);
    reposList.innerHTML = '<p class="muted">Failed to load repositories</p>';
  }
}

// Fetch public events and build a contributions map (date -> count)
// We page through up to `maxPages` pages of events (30 per page), stopping earlier if we cover > 1 year
async function fetchContributionsAndRender(username){
  heatmapContainer.innerHTML = 'Loading...';
  try{
    const dateCounts = await fetchEventsCounts(username, 8); // try up to 8 pages (~240 events)
    // build a date range for the last 53 weeks (to emulate GitHub calendar)
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (7*53) + 1); // approx 53 weeks

    const dayMap = buildDateMap(start, end);
    // merge counts
    for (const [date, cnt] of Object.entries(dateCounts)){
      if (dayMap[date] != null) dayMap[date] = cnt;
    }

    renderHeatmap(dayMap, start, end);
  }catch(err){
    console.error(err);
    heatmapContainer.innerHTML = '<p class="muted">Failed to build heatmap</p>';
  }
}

async function fetchEventsCounts(username, maxPages=8){
  const counts = {}; // YYYY-MM-DD -> count
  const now = Date.now();
  const oneYearMs = 365 * 24 * 3600 * 1000;
  for(let page=1; page<=maxPages; page++){
    const url = `https://api.github.com/users/${encodeURIComponent(username)}/events/public?page=${page}&per_page=30`;
    const resp = await fetch(url);
    if (!resp.ok){
      // if rate-limited or not found, stop
      if (resp.status === 404) throw new Error('User not found');
      throw new Error(`GitHub API error: ${resp.status}`);
    }
    const events = await resp.json();
    if (!Array.isArray(events) || events.length===0) break;

    for (const ev of events){
      // created_at like 2023-01-02T12:34:56Z
      const date = (ev.created_at || '').slice(0,10);
      if (!date) continue;
      // only count events within last year
      const t = new Date(ev.created_at).getTime();
      if (now - t > oneYearMs) continue;
      counts[date] = (counts[date] || 0) + 1;
    }

    // Heuristic: stop early if last event on page is older than 1 year
    const last = events[events.length-1];
    if (last){
      const t = new Date(last.created_at).getTime();
      if (now - t > oneYearMs) break;
    }
  }
  return counts;
}

// Build map of dates between start..end inclusive, initialized to 0
function buildDateMap(start, end){
  const map = {};
  const d = new Date(start);
  while (d <= end){
    const key = d.toISOString().slice(0,10);
    map[key] = 0;
    d.setDate(d.getDate()+1);
  }
  return map;
}

function renderHeatmap(dayMap, start, end){
  heatmapContainer.innerHTML = '';

  // compute max count to scale colors
  const counts = Object.values(dayMap);
  const max = Math.max(...counts, 1);

  // SVG calendar: weeks across (columns), days down (rows Sun->Sat)
  const square = 12; // size of square
  const gap = 3;
  // start from the first Sunday <= start
  const startDate = new Date(start);
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);

  // number of weeks
  const totalDays = Math.ceil((end - startDate) / (1000*3600*24)) + 1;
  const weeks = Math.ceil(totalDays / 7);

  const svgW = weeks * (square + gap) + 80; // extra for month labels
  const svgH = (7 * (square + gap)) + 20;

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('width', svgW);
  svg.setAttribute('height', svgH);
  svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);

  // month labels
  const monthLabels = {};

  let cur = new Date(startDate);
  for (let w=0; w<weeks; w++){
    for (let d=0; d<7; d++){
      const x = 40 + w * (square + gap);
      const y = 10 + d * (square + gap);
      const key = cur.toISOString().slice(0,10);
      const cnt = dayMap[key] || 0;
      const color = colorForCount(cnt, max);

      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', square);
      rect.setAttribute('height', square);
      rect.setAttribute('rx', 2);
      rect.setAttribute('ry', 2);
      rect.setAttribute('fill', color);
      rect.setAttribute('data-date', key);
      rect.setAttribute('data-count', String(cnt));

      // tooltip
      const title = document.createElementNS(ns, 'title');
      title.textContent = `${key}: ${cnt} contribution${cnt===1?'':'s'}`;
      rect.appendChild(title);

      svg.appendChild(rect);

      // mark month label for first day of month
      if (cur.getDate() === 1) monthLabels[w] = cur.toLocaleString(undefined,{month:'short'});

      cur.setDate(cur.getDate()+1);
    }
  }

  // draw month labels
  Object.keys(monthLabels).forEach(wk => {
    const tx = 40 + (wk * (square + gap));
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', tx);
    t.setAttribute('y', 8);
    t.setAttribute('font-size', 10);
    t.setAttribute('fill', '#6b7280');
    t.textContent = monthLabels[wk];
    svg.appendChild(t);
  });

  // day labels (Mon, Wed, Fri) — emulate GitHub showing some labels
  const dayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  ['Mon','Wed','Fri'].forEach(dname => {
    const idx = dayLabels.indexOf(dname);
    if (idx >=0){
      const t = document.createElementNS(ns, 'text');
      t.setAttribute('x', 6);
      t.setAttribute('y', 10 + idx * (square + gap) + (square/1.5));
      t.setAttribute('font-size', 10);
      t.setAttribute('fill', '#6b7280');
      t.textContent = dname;
      svg.appendChild(t);
    }
  });

  heatmapContainer.appendChild(svg);

  // legend
  heatmapLegend.innerHTML = '';
  const lbl = document.createElement('div');
  lbl.textContent = 'Less';
  heatmapLegend.appendChild(lbl);
  COLORS.forEach((c, i)=>{
    const box = document.createElement('div');
    box.className = 'box';
    box.style.background = c;
    heatmapLegend.appendChild(box);
  });
  const more = document.createElement('div');
  more.textContent = 'More';
  heatmapLegend.appendChild(more);
}

function colorForCount(count, max){
  if (!count) return COLORS[0];
  // use log scaling to spread out colors if max is large
  const thresholds = [1, Math.max(1, Math.round(max*0.25)), Math.max(1, Math.round(max*0.5)), Math.max(1, Math.round(max*0.8))];
  if (count >= thresholds[3]) return COLORS[4];
  if (count >= thresholds[2]) return COLORS[3];
  if (count >= thresholds[1]) return COLORS[2];
  return COLORS[1];
}

function showError(msg){
  errorBox.hidden = false;
  errorBox.textContent = msg;
}
function clearError(){ errorBox.hidden = true; errorBox.textContent = ''; }

function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]);
}

// Done — exported functions for testing (if needed)
window._gh = { renderHeatmap, fetchEventsCounts };
