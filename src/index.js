const accessToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImVkOWViNjM3MmQ2YzJiNTFmNTE2ZGNjMmJlZmRjMjJlZDNhZmQ2YTZmNDU5YTUyMjAxMGJjMDA3YTNjZWYzY2RlZWQ1M2VjNWVlYWRlODlkIn0.eyJhdWQiOiIwZTBiMjE4My1hZWQzLTQ1MGYtYjIzNS01MmEwMDFhNjE4NGQiLCJqdGkiOiJlZDllYjYzNzJkNmMyYjUxZjUxNmRjYzJiZWZkYzIyZWQzYWZkNmE2ZjQ1OWE1MjIwMTBiYzAwN2EzY2VmM2NkZWVkNTNlYzVlZWFkZTg5ZCIsImlhdCI6MTcwOTEyMjk1MSwibmJmIjoxNzA5MTIyOTUxLCJleHAiOjE3MjI0NzA0MDAsInN1YiI6IjEwNzM0NDU4IiwiZ3JhbnRfdHlwZSI6IiIsImFjY291bnRfaWQiOjMxNTk5Mzg2LCJiYXNlX2RvbWFpbiI6ImFtb2NybS5ydSIsInZlcnNpb24iOjIsInNjb3BlcyI6WyJjcm0iLCJmaWxlcyIsImZpbGVzX2RlbGV0ZSIsIm5vdGlmaWNhdGlvbnMiLCJwdXNoX25vdGlmaWNhdGlvbnMiXSwiaGFzaF91dWlkIjoiNjBiYTY5MDktODE0Yi00ZmQ1LTk5YzItNjgyZTZhZWRlZmViIn0.UmHouT-SPdK7ErSuxVahQxbA9qmMt03ZMmjUxo5FR2vn7F4nJPhUTwLlKFDm6Zroh-QFCDGKS2JBKbZQOSpEmcYtyrXMbmgIUZd8q41F_htX3oHUQnxP0-8a5vesJt0E7JD5qvzXJkdhQtOVr1LT64l94z6y1kf614BSxKhjPHt6nX6cVLVLhTZDIIvwfdKKAS16E0zYrtLaRwVYn6TgEjsdBCa9ntu3lXfIOuzohlz6FJBC7YaunAZ_WA3pDsocyGTdc77Su4A3tEcN3P7ZVidmD98vsD-bCO9bqZXKL6DGubSy_49862DGATRzmODJCFBQFGYh4ySGl1xdBYZoaw';

const upArrow = '\u2191';
const downArrow = '\u2193';

const store = {
  deals: [],
  page: 1,
  pagination: '2',
  prevPage: false,
  nextPage: false,
  lastFetchTime: 0,
  loading: false,
}

function sort(by, order) {
  const obj = {
    'name' : {
      'asc': (a, b) => {
        return a.name.localeCompare(b.name);
      },
      'desc': (a, b) => {
        return -a.name.localeCompare(b.name);
      },
    },
    'price' : {
      'asc': (a, b) => a.price - b.price,
      'desc': (a, b) => b.price - a.price,
    },
  }
  return obj[by][order];
}

function loading (isLoading) {
  store.loading = isLoading;
  if (isLoading) {
    const tableBody = document.getElementById('table-body');
    tableBody.innerHTML = `<tr><td colSpan="8" class="text-center" id="loading">Loading...</td></tr>`
    const buttons = document.getElementsByName("button")
    const links = document.querySelectorAll('.btn-link');
    buttons.forEach((btn)=> {
      btn.classList.add("disabled");
      btn.disabled = true;
    });
    links.forEach((link) => {
      link.classList.add("disabled");
      link.disabled = true;
    });
  } else {
    const buttons = document.getElementsByName("button")
    const links = document.querySelectorAll('.btn-link');
    buttons.forEach((btn)=> {
      btn.classList.remove("disabled");
      btn.disabled = false;
    });
    links.forEach((link) => {
      link.classList.remove("disabled");
      link.disabled = false;
    });
  }
}

async function fetchDeals(page= 1, limit= store.pagination) {
  const url = `http://localhost:3000/api?page=${page}&limit=${limit}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    if (!response.ok) {
      throw new Error(`Error response: ${response.status}`);
    }

    const data = await response.json();
    const currDeals = data['_embedded'].leads;
    const nextPage = data['_links'].next;
    const prevPage = data['_links'].prev;
    return {
      currDeals,
      nextPage,
      prevPage
    };
  } catch (e) {
    console.log("Error fetch: ", e)
  }
}

function app() {
  async function fetchAllDeals() {
    loading(true);
    let page = 1;
    let deals = [];
    const fetch = async(page, deals) => {
      const currentTime = Date.now();
      const timeDiff = currentTime - store.lastFetchTime;
      if (timeDiff < 500) {
        await new Promise(resolve => setTimeout(resolve, 500 - timeDiff));
      }
      store.lastFetchTime = Date.now();
      fetchDeals(page, 5)
        .then((res) => {
          deals.push(...res.currDeals)
          if (!res.nextPage) {
            loading(false);
            store.nextPage = false;
            store.prevPage = false;
            store.deals = deals;
            updateTable(deals)
            updateFooter(1, store.pagination);
          } else {
            page += 1;
            fetch(page, deals);
          }
        })
        .catch(() => {
          loading(false);
        });
    }
    fetch(page, deals);

  }
  async function fetchPageDeals() {
    loading(true);
    fetchDeals(store.page, store.pagination)
      .then((res) => {
        loading(false);
        store.deals = [...res.currDeals];
        store.nextPage = !!res.nextPage;
        store.prevPage = !!res.prevPage;
        updateTable([...res.currDeals])
        updateFooter(store.page, store.pagination);
      })
      .catch(() => {
        loading(false);
      });
  }

  function updateTable(data) {
    const tableBody = document.getElementById('table-body');
    if (!data || data.length === 0) {
      tableBody.innerHTML = `<tr class="text-center"><td>Список пуст</td></tr>`
    }
    tableBody.innerHTML = '';
    data.forEach((deal) => {
      const row = document.createElement('tr');
      const createdAt = new Date(deal.created_at * 1000);
      const updatedAt = new Date(deal.updated_at * 1000);
      row.innerHTML = `
      <tr class="text-center">
        <td class="text-center">${deal.id}</td>
        <td class="text-center">${deal.name}</td>
        <td class="text-center">${deal.price} руб</td>
        <td class="text-center">${createdAt.toLocaleString()}</td>
        <td class="text-center">${deal.created_by}</td>
        <td class="text-center">${updatedAt.toLocaleString()}</td>
        <td class="text-center">${deal.updated_by}</td>
        <td class="text-center">${deal.responsible_user_id}</td>
      </tr>
      `
      tableBody.appendChild(row);
    })
  }

  function updateFooter(page) {
    const footer = document.getElementById('pagination-footer');

    footer.innerHTML = `
    <div>
      Страница ${page}
    </div>
    ${store.prevPage ? '<button class="btn btn-link">Предыдущая</button>' : ''}
    ${store.nextPage ? '<button class="btn btn-link">Следующая</button>' : ''}
    `;

    const links = document.querySelectorAll('.btn-link');
    links.forEach((link) => 
      link.addEventListener('click', () => {
        const step = link.textContent === 'Предыдущая' ? -1 : 1;
        store.page = store.page + step;
        fetchPageDeals();
      })
    )
  }

  document.getElementById("pagination").addEventListener("change", function () {
    store.pagination = this.value;
    store.page = 1;
    if (store.pagination === "all"){
      fetchAllDeals();
    } else {
      fetchPageDeals();
    }
  });

  const sortButtons = document.querySelectorAll('[role="button"]');
  sortButtons.forEach((sortButton) => {
    sortButton.addEventListener('click', (event) => {
      console.log(event);
      if (store.loading) return;
      if (event.target.firstElementChild.textContent === upArrow) {
        store.deals = store.deals.sort(sort(event.target.id, 'desc'));
        event.target.firstElementChild.textContent = downArrow;
      } else {
        store.deals = store.deals.sort(sort(event.target.id, 'asc'));
        event.target.firstElementChild.textContent = upArrow;
      }
      updateTable(store.deals);
    });
  })

  fetchPageDeals();
}
app();