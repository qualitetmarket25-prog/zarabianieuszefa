(function(){
  var CRM_KEY = 'qm_crm_v1';

  function uid(){
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function readCrm(){
    try{
      var raw = localStorage.getItem(CRM_KEY);
      var data = raw ? JSON.parse(raw) : {};
      if (!data || typeof data !== 'object') data = {};
      if (!Array.isArray(data.leads)) data.leads = [];
      if (!Array.isArray(data.tasks)) data.tasks = [];
      return data;
    }catch(err){
      return { leads: [], tasks: [] };
    }
  }

  function writeCrm(data){
    localStorage.setItem(CRM_KEY, JSON.stringify(data));
    return data;
  }

  function money(value){
    return new Intl.NumberFormat('pl-PL',{style:'currency',currency:'PLN',maximumFractionDigits:0}).format(Number(value)||0);
  }

  function fmtDate(value){
    if(!value) return '—';
    var d = new Date(value);
    if(String(d)==='Invalid Date') return value;
    return new Intl.DateTimeFormat('pl-PL',{year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  }

  function normalizeLead(item){
    item = item || {};
    return {
      id: item.id || uid(),
      clientName: item.clientName || 'Bez nazwy',
      phone: item.phone || '',
      email: item.email || '',
      source: item.source || '',
      interest: item.interest || '',
      budget: Number(item.budget) || 0,
      status: item.status || 'new',
      followUpAt: item.followUpAt || '',
      note: item.note || '',
      createdAt: item.createdAt || new Date().toISOString()
    };
  }

  function normalizeTask(item){
    item = item || {};
    return {
      id: item.id || uid(),
      title: item.title || 'Nowy task',
      dueAt: item.dueAt || '',
      priority: item.priority || 'normal',
      leadRef: item.leadRef || '',
      note: item.note || '',
      done: Boolean(item.done),
      createdAt: item.createdAt || new Date().toISOString()
    };
  }

  function statusLabel(status){
    return {
      new: 'Nowy',
      contacted: 'Kontakt',
      qualified: 'Zakwalifikowany',
      offer: 'Oferta',
      won: 'Wygrany',
      lost: 'Stracony'
    }[status] || status;
  }

  function priorityLabel(priority){
    return {
      low: 'Niski',
      normal: 'Normalny',
      high: 'Wysoki'
    }[priority] || priority;
  }

  function seedData(){
    var data = readCrm();
    if(!data.leads.length){
      data.leads = [
        normalizeLead({clientName:'Anna Nowak', phone:'+48 500 111 222', email:'anna@firma.pl', source:'Facebook Ads', interest:'Sklep PRO', budget:2499, status:'new', followUpAt:new Date().toISOString().slice(0,10), note:'Poprosiła o demo panelu.'}),
        normalizeLead({clientName:'Marek Lis', phone:'+48 600 333 444', email:'marek@biz.pl', source:'Landing', interest:'Pakiet Elite', budget:4999, status:'offer', followUpAt:new Date(Date.now()+86400000).toISOString().slice(0,10), note:'Wysłana oferta + pytania o multi-store.'}),
        normalizeLead({clientName:'Klaudia M.', phone:'+48 700 222 555', email:'klaudia@shop.pl', source:'Polecenie', interest:'Panel hurtowni', budget:1799, status:'qualified', followUpAt:new Date(Date.now()+2*86400000).toISOString().slice(0,10), note:'Chce import CSV i sklep B2B.'})
      ];
    }
    if(!data.tasks.length){
      data.tasks = [
        normalizeTask({title:'Oddzwoń do Anny', dueAt:new Date().toISOString().slice(0,10), priority:'high', leadRef:'Anna Nowak', note:'Ustalić wdrożenie i termin startu.'}),
        normalizeTask({title:'Wyślij follow-up do Marka', dueAt:new Date(Date.now()+86400000).toISOString().slice(0,10), priority:'normal', leadRef:'Marek Lis', note:'Dopytać o decyzję i doprecyzować pricing.'})
      ];
    }
    writeCrm(data);
    render();
  }

  function setStats(data){
    var leads = data.leads;
    var tasks = data.tasks;
    var today = new Date().toISOString().slice(0,10);
    var active = leads.filter(function(x){ return ['contacted','qualified','offer'].indexOf(x.status) >= 0; });
    var won = leads.filter(function(x){ return x.status === 'won'; });
    var newCount = leads.filter(function(x){ return x.status === 'new'; }).length;
    var dueToday = leads.filter(function(x){ return x.followUpAt && x.followUpAt <= today && x.status !== 'won' && x.status !== 'lost'; }).length;
    var openTasks = tasks.filter(function(x){ return !x.done; }).length;
    var potential = active.reduce(function(sum, x){ return sum + (Number(x.budget) || 0); }, 0);

    document.getElementById('statLeadsAll').textContent = String(leads.length);
    document.getElementById('statLeadsActive').textContent = String(active.length);
    document.getElementById('statWon').textContent = String(won.length);
    document.getElementById('statPotential').textContent = money(potential);
    document.getElementById('statLeadsNew').textContent = String(newCount);
    document.getElementById('statFollowToday').textContent = String(dueToday);
    document.getElementById('statTasksOpen').textContent = String(openTasks);
  }

  function renderPipeline(data){
    var wrap = document.getElementById('pipelineBoard');
    if(!wrap) return;
    var groups = [
      {key:'new', title:'Nowe'},
      {key:'contacted', title:'Kontakt'},
      {key:'qualified', title:'Zakwalifikowane'},
      {key:'offer', title:'Oferta'},
      {key:'won', title:'Wygrane'},
      {key:'lost', title:'Stracone'}
    ];
    wrap.innerHTML = groups.map(function(group){
      var list = data.leads.filter(function(item){ return item.status === group.key; });
      return '<div class="pipeline-col">' +
        '<h3>' + group.title + '<span class="pipeline-count">' + list.length + '</span></h3>' +
        (list.length ? list.map(function(item){
          return '<div class="pipeline-item">' +
            '<strong>' + escapeHtml(item.clientName) + '</strong>' +
            '<div class="meta">' +
              '<span class="badge ' + item.status + '">' + statusLabel(item.status) + '</span>' +
              '<span class="badge">' + escapeHtml(item.source || 'brak źródła') + '</span>' +
            '</div>' +
            '<div class="small-muted">' + escapeHtml(item.interest || 'brak oferty') + '</div>' +
            '<p>Budżet: <strong>' + money(item.budget) + '</strong><br>Follow-up: ' + escapeHtml(fmtDate(item.followUpAt)) + '</p>' +
          '</div>';
        }).join('') : '<div class="empty-box">Brak leadów</div>') +
      '</div>';
    }).join('');
  }

  function renderTasks(data){
    var wrap = document.getElementById('tasksList');
    if(!wrap) return;
    var list = data.tasks.slice().sort(function(a,b){
      return String(a.dueAt || '').localeCompare(String(b.dueAt || ''));
    });
    wrap.innerHTML = list.length ? list.map(function(task){
      return '<div class="task-item">' +
        '<strong>' + escapeHtml(task.title) + '</strong>' +
        '<div class="meta">' +
          '<span class="badge ' + (task.done ? 'completed' : 'processing') + '">' + (task.done ? 'Zrobione' : 'Otwarte') + '</span>' +
          '<span class="badge">' + escapeHtml(priorityLabel(task.priority)) + '</span>' +
          '<span class="badge">' + escapeHtml(task.leadRef || 'ogólne') + '</span>' +
        '</div>' +
        '<p>Termin: ' + escapeHtml(fmtDate(task.dueAt)) + '<br>' + escapeHtml(task.note || 'Brak opisu') + '</p>' +
        '<div class="row-actions">' +
          '<button class="btn-ghost" data-task-toggle="' + task.id + '">' + (task.done ? 'Otwórz ponownie' : 'Oznacz jako zrobione') + '</button>' +
          '<button class="btn-ghost danger" data-task-delete="' + task.id + '">Usuń</button>' +
        '</div>' +
      '</div>';
    }).join('') : '<div class="empty-box">Brak tasków</div>';
  }

  function renderTable(data){
    var tbody = document.getElementById('crmTableBody');
    if(!tbody) return;
    var q = ((document.getElementById('crmSearch') || {}).value || '').trim().toLowerCase();
    var list = data.leads.filter(function(item){
      if(!q) return true;
      return [item.clientName, item.email, item.phone, item.interest, item.source]
        .join(' ')
        .toLowerCase()
        .indexOf(q) >= 0;
    });

    tbody.innerHTML = list.length ? list.map(function(item){
      return '<tr>' +
        '<td><strong>' + escapeHtml(item.clientName) + '</strong><div class="small-muted">' + escapeHtml(item.source || '—') + '</div></td>' +
        '<td><span class="badge ' + item.status + '">' + statusLabel(item.status) + '</span></td>' +
        '<td>' + escapeHtml(item.interest || '—') + '</td>' +
        '<td>' + money(item.budget) + '</td>' +
        '<td>' + escapeHtml(fmtDate(item.followUpAt)) + '</td>' +
        '<td><div>' + escapeHtml(item.phone || '—') + '</div><div class="small-muted">' + escapeHtml(item.email || '—') + '</div></td>' +
        '<td><div class="row-actions">' +
          '<button class="btn-ghost" data-lead-next="' + item.id + '">Następny status</button>' +
          '<button class="btn-ghost danger" data-lead-delete="' + item.id + '">Usuń</button>' +
        '</div></td>' +
      '</tr>';
    }).join('') : '<tr><td colspan="7"><div class="empty-box">Brak leadów do pokazania</div></td></tr>';
  }

  function nextStatus(current){
    var order = ['new','contacted','qualified','offer','won'];
    var idx = order.indexOf(current);
    return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : 'won';
  }

  function exportJson(){
    var data = readCrm();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'qm-crm-export.json';
    a.click();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function bindForms(){
    var leadForm = document.getElementById('leadForm');
    var taskForm = document.getElementById('taskForm');
    var search = document.getElementById('crmSearch');
    var exportBtn = document.getElementById('exportCrmBtn');
    var clearBtn = document.getElementById('clearCrmBtn');
    var seedBtn = document.getElementById('seedCrmBtn');

    if(leadForm){
      leadForm.addEventListener('submit', function(e){
        e.preventDefault();
        var form = new FormData(leadForm);
        var data = readCrm();
        data.leads.unshift(normalizeLead({
          clientName: form.get('clientName'),
          phone: form.get('phone'),
          email: form.get('email'),
          source: form.get('source'),
          interest: form.get('interest'),
          budget: form.get('budget'),
          status: form.get('status'),
          followUpAt: form.get('followUpAt'),
          note: form.get('note')
        }));
        writeCrm(data);
        leadForm.reset();
        render();
      });
    }

    if(taskForm){
      taskForm.addEventListener('submit', function(e){
        e.preventDefault();
        var form = new FormData(taskForm);
        var data = readCrm();
        data.tasks.unshift(normalizeTask({
          title: form.get('title'),
          dueAt: form.get('dueAt'),
          priority: form.get('priority'),
          leadRef: form.get('leadRef'),
          note: form.get('note')
        }));
        writeCrm(data);
        taskForm.reset();
        render();
      });
    }

    if(search){
      search.addEventListener('input', render);
    }
    if(exportBtn){
      exportBtn.addEventListener('click', exportJson);
    }
    if(clearBtn){
      clearBtn.addEventListener('click', function(){
        if(confirm('Na pewno wyczyścić cały CRM?')){
          writeCrm({leads:[], tasks:[]});
          render();
        }
      });
    }
    if(seedBtn){
      seedBtn.addEventListener('click', seedData);
    }

    document.addEventListener('click', function(e){
      var nextLead = e.target.closest('[data-lead-next]');
      if(nextLead){
        var id = nextLead.getAttribute('data-lead-next');
        var data = readCrm();
        data.leads = data.leads.map(function(item){
          if(item.id !== id) return item;
          item.status = nextStatus(item.status);
          return item;
        });
        writeCrm(data);
        render();
        return;
      }
      var delLead = e.target.closest('[data-lead-delete]');
      if(delLead){
        var id = delLead.getAttribute('data-lead-delete');
        var data = readCrm();
        data.leads = data.leads.filter(function(item){ return item.id !== id; });
        writeCrm(data);
        render();
        return;
      }
      var toggleTask = e.target.closest('[data-task-toggle]');
      if(toggleTask){
        var id = toggleTask.getAttribute('data-task-toggle');
        var data = readCrm();
        data.tasks = data.tasks.map(function(item){
          if(item.id !== id) return item;
          item.done = !item.done;
          return item;
        });
        writeCrm(data);
        render();
        return;
      }
      var delTask = e.target.closest('[data-task-delete]');
      if(delTask){
        var id = delTask.getAttribute('data-task-delete');
        var data = readCrm();
        data.tasks = data.tasks.filter(function(item){ return item.id !== id; });
        writeCrm(data);
        render();
      }
    });
  }

  function render(){
    var data = readCrm();
    setStats(data);
    renderPipeline(data);
    renderTasks(data);
    renderTable(data);
  }

  document.addEventListener('DOMContentLoaded', function(){
    bindForms();
    render();
  });
})();
